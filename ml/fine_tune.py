"""
Fine-tuning placeholder for NuerLingo.

Once enough verified dictionary entries accumulate, this script can be used
to fine-tune the NLLB model on domain-specific Nuer data.

TODO:
  - Export verified words/phrases from PostgreSQL as a parallel corpus
  - Format as HuggingFace Dataset (source_lang, target_lang, translation pairs)
  - Fine-tune with Seq2SeqTrainer + data collation
  - Evaluate with BLEU/chrF scores
  - Upload fine-tuned model to HuggingFace Hub and update NLLB_MODEL_NAME in config
"""

# Stub — implementation pending sufficient training data
raise NotImplementedError(
    "Fine-tuning requires a parallel corpus. "
    "Export verified entries from the database first."
)
