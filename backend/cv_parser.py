import fitz


def extract_text_from_pdf(file_bytes: bytes) -> str:
    extracted_text = ""

    with fitz.open(stream=file_bytes, filetype="pdf") as document:
        for page in document:
            extracted_text += page.get_text() + "\n"

    return extracted_text.strip()


