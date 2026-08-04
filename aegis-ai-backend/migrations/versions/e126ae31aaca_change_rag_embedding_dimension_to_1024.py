"""change rag embedding dimension to 1024

Revision ID: e126ae31aaca
Revises: 7a4c609ed279
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e126ae31aaca"
down_revision: Union[str, Sequence[str], None] = "7a4c609ed279"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    embedding_count = connection.scalar(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rag_document_chunks
            WHERE embedding IS NOT NULL
            """
        )
    )

    if embedding_count:
        raise RuntimeError(
            "Existing embeddings must be deleted "
            "before changing to vector(1024)."
        )

    op.execute(
        """
        ALTER TABLE rag_document_chunks
        ALTER COLUMN embedding
        TYPE vector(1024)
        """
    )


def downgrade() -> None:
    connection = op.get_bind()

    embedding_count = connection.scalar(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rag_document_chunks
            WHERE embedding IS NOT NULL
            """
        )
    )

    if embedding_count:
        raise RuntimeError(
            "Existing embeddings must be deleted "
            "before restoring vector(1536)."
        )

    op.execute(
        """
        ALTER TABLE rag_document_chunks
        ALTER COLUMN embedding
        TYPE vector(1536)
        """
    )
