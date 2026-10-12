import json
from sqlalchemy import JSON, TypeDecorator
from pgvector.sqlalchemy import Vector

class Vector512(TypeDecorator):
    """
    Dual-database 512-dimensional vector type:
    - PostgreSQL: Native pgvector Vector(512) with HNSW acceleration
    - MySQL: JSON array of 512 floats with vectorized in-memory cosine search
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Vector(512))
        else:
            return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if hasattr(value, "tolist"):
            return value.tolist()
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value

