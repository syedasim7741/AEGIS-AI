"""create rag document tables

Revision ID: 7a4c609ed279
Revises: 11626f4f7b3b
Create Date: 2026-08-01 22:09:40.453944
"""

from typing import Sequence, Union

from alembic import op
from pgvector.sqlalchemy import VECTOR
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# Revision identifiers used by Alembic.
revision: str = "7a4c609ed279"
down_revision: Union[str, Sequence[str], None] = "11626f4f7b3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


rag_document_status_enum = postgresql.ENUM(
    "Pending",
    "Processing",
    "Ready",
    "Failed",
    name="rag_document_status",
    create_type=False,
)


def upgrade() -> None:
    """Create RAG document and document-chunk tables."""

    bind = op.get_bind()

    rag_document_status_enum.create(
        bind,
        checkfirst=True,
    )

    op.create_table(
        "rag_documents",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "uploaded_by_user_id",
            sa.UUID(),
            nullable=True,
        ),
        sa.Column(
            "original_filename",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "stored_filename",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "content_type",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "file_size_bytes",
            sa.BigInteger(),
            nullable=False,
        ),
        sa.Column(
            "storage_path",
            sa.String(length=500),
            nullable=False,
        ),
        sa.Column(
            "checksum_sha256",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "status",
            rag_document_status_enum,
            nullable=False,
            server_default=sa.text(
                "'Pending'::rag_document_status"
            ),
        ),
        sa.Column(
            "page_count",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "chunk_count",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_path"),
        sa.UniqueConstraint("stored_filename"),
    )

    op.create_index(
        "ix_rag_documents_checksum_sha256",
        "rag_documents",
        ["checksum_sha256"],
        unique=False,
    )

    op.create_index(
        "ix_rag_documents_original_filename",
        "rag_documents",
        ["original_filename"],
        unique=False,
    )

    op.create_index(
        "ix_rag_documents_status",
        "rag_documents",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_rag_documents_uploaded_by_user_id",
        "rag_documents",
        ["uploaded_by_user_id"],
        unique=False,
    )

    op.create_table(
        "rag_document_chunks",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "document_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "chunk_index",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "page_number",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "character_count",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "token_count",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "embedding",
            VECTOR(1536),
            nullable=True,
        ),
        sa.Column(
            "chunk_metadata",
            postgresql.JSONB(
                astext_type=sa.Text()
            ),
            nullable=False,
            server_default=sa.text(
                "'{}'::jsonb"
            ),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["rag_documents.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "document_id",
            "chunk_index",
            name="uq_rag_document_chunk_index",
        ),
    )

    op.create_index(
        "ix_rag_document_chunks_document_id",
        "rag_document_chunks",
        ["document_id"],
        unique=False,
    )

    op.create_index(
        "ix_rag_document_chunks_document_page",
        "rag_document_chunks",
        ["document_id", "page_number"],
        unique=False,
    )

    op.create_index(
        "ix_rag_document_chunks_page_number",
        "rag_document_chunks",
        ["page_number"],
        unique=False,
    )


def downgrade() -> None:
    """Remove RAG document and document-chunk tables."""

    op.drop_index(
        "ix_rag_document_chunks_page_number",
        table_name="rag_document_chunks",
    )

    op.drop_index(
        "ix_rag_document_chunks_document_page",
        table_name="rag_document_chunks",
    )

    op.drop_index(
        "ix_rag_document_chunks_document_id",
        table_name="rag_document_chunks",
    )

    op.drop_table("rag_document_chunks")

    op.drop_index(
        "ix_rag_documents_uploaded_by_user_id",
        table_name="rag_documents",
    )

    op.drop_index(
        "ix_rag_documents_status",
        table_name="rag_documents",
    )

    op.drop_index(
        "ix_rag_documents_original_filename",
        table_name="rag_documents",
    )

    op.drop_index(
        "ix_rag_documents_checksum_sha256",
        table_name="rag_documents",
    )

    op.drop_table("rag_documents")

    rag_document_status_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )
