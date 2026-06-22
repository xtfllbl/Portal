#!/usr/bin/env python3
import json
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PROCESSOR_FILES = {
    "TSYS": Path("/Users/beaver/TsysPayment-v1.3.121-config-all-pro.xml"),
    "FISERV": Path("/Users/beaver/Fiserv_WizarPos_Attend_US_1.0.34_20260622.xml"),
    "ELAVON": Path("/Users/beaver/ElavonEU-v1.1.57-config-all-pro.xml"),
    "NUVEI ATTD": Path("/Users/beaver/Nuvei_Attended_ca_1.0.20_cfg_260622.xml"),
    "NUVEI UPT": Path("/Users/beaver/Nuvei_UnAttend_CA_cfg_1.0.41_20260622.xml"),
    "OXPAY": Path("/Users/beaver/oxpay_Unattended_v1.0.19_260609_params.xml"),
}


def normalize_text(value):
    return " ".join((value or "").split())


def parse_processor(path):
    root = ET.parse(path).getroot()
    groups = []

    for fieldset in root.findall("fieldset"):
        fields = []
        for field in fieldset.findall("field"):
            check = field.find("check")
            options = [
                [option.get("value", ""), normalize_text(option.text)]
                for option in field.findall("./select/option")
            ]
            option_spec = options or None
            if len(options) == 2 and {text.lower() for _, text in options} == {
                "enable",
                "disable",
            }:
                option_spec = "binary"

            fields.append(
                [
                    field.get("key", ""),
                    field.get("label", ""),
                    field.get("comment", ""),
                    field.get("default", ""),
                    check is not None and check.get("allowempty") == "false",
                    check.get("minlen") if check is not None else None,
                    check.get("maxlen") if check is not None else None,
                    check.get("rule") if check is not None else None,
                    option_spec,
                ]
            )

        groups.append([fieldset.get("name", ""), fields])

    return groups


def main():
    missing = [str(path) for path in PROCESSOR_FILES.values() if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing XML files:\n" + "\n".join(missing))

    schema = {
        processor: parse_processor(path)
        for processor, path in PROCESSOR_FILES.items()
    }
    output = (
        "const PROCESSOR_PARAMETER_OPTIONS = {};\n"
        "const PROCESSOR_PARAMETER_SCHEMA = "
        + json.dumps(schema, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    (ROOT / "processor-parameter-data.js").write_text(output, encoding="utf-8")


if __name__ == "__main__":
    main()
