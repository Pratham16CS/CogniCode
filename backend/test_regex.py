import json
import re

raw_llm_output = """[
    {
        "path": "Backend\\\\graph.py",
        "skeleton": "code with \\escape \\d \\w and \\"quotes\\" \\n newline",
        "summary": "summary text"
    }
]"""

print('Raw output string representation:')
print(repr(raw_llm_output))

def repair_json(json_str):
    # 1. Temporarily replace valid escaped backslashes `\\` with a placeholder
    temp = json_str.replace('\\\\', '__ESCAPED_SLASH__')
    
    # 2. Now any remaining `\` is either a valid JSON escape char `\n` `\"` etc, or an invalid one `\d` `\w` `\e`.
    # We replace any `\` that is NOT followed by a valid JSON escape char with `\\`
    # Note: `\\` is not in the lookahead anymore because we removed them in step 1.
    temp = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', temp)
    
    # 3. Restore the valid escaped backslashes
    cleaned = temp.replace('__ESCAPED_SLASH__', '\\\\')
    
    return cleaned

cleaned = repair_json(raw_llm_output)
print("\nCleaned representation:")
print(repr(cleaned))

try:
    data = json.loads(cleaned)
    print("\nSUCCESS!")
    print(json.dumps(data, indent=2))
except Exception as e:
    print("\nFAILED:", e)
