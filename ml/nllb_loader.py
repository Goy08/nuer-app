"""
Standalone NLLB model loader — useful for scripts, notebooks, and fine-tuning.
The application itself uses api/services/nllb_service.py which wraps this
in an async-safe manner.
"""

from functools import lru_cache
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM  # type: ignore

NLLB_MODEL = "facebook/nllb-200-distilled-600M"

# Language codes supported by this app
LANG_ENGLISH = "eng_Latn"
LANG_NUER = "nus_Latn"


@lru_cache(maxsize=1)
def load_model(model_name: str = NLLB_MODEL):
    """Load and cache the NLLB tokenizer and model."""
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    model.eval()
    return tokenizer, model


def translate(
    text: str,
    source_lang: str = LANG_ENGLISH,
    target_lang: str = LANG_NUER,
    model_name: str = NLLB_MODEL,
    num_beams: int = 4,
    max_length: int = 512,
) -> str:
    """Translate text using the NLLB model (synchronous, blocking)."""
    tokenizer, model = load_model(model_name)
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=max_length)
    target_lang_id = tokenizer.convert_tokens_to_ids(target_lang)
    outputs = model.generate(
        **inputs,
        forced_bos_token_id=target_lang_id,
        max_length=max_length,
        num_beams=num_beams,
        early_stopping=True,
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


if __name__ == "__main__":
    # Quick smoke test
    result = translate("Hello, how are you?", LANG_ENGLISH, LANG_NUER)
    print(f"eng → nus: {result}")
    back = translate(result, LANG_NUER, LANG_ENGLISH)
    print(f"nus → eng: {back}")
