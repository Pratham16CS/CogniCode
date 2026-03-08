from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class FileCache(Base):
    """
    Smart Cache Layer for files.
    Calculates MD5 hash of raw file content to prevent re-analyzing un-changed files.
    """
    __tablename__ = "file_cache"

    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String, index=True)
    file_path = Column(String, index=True)
    file_hash = Column(String, index=True)
    
    # Cached outputs from the Mapping pipeline
    skeleton = Column(Text)
    summary = Column(Text)
    removal_log = Column(Text)
    logical_core = Column(Text)
