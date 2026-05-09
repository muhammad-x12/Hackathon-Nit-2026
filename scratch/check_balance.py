import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    parens = 0
    brackets = 0
    in_string = False
    quote_char = ''
    
    for i, char in enumerate(content):
        if char in ["'", '"', '`']:
            if not in_string:
                in_string = True
                quote_char = char
            elif quote_char == char:
                # Check for backslash escape
                if content[i-1] != '\\':
                    in_string = False
        
        if not in_string:
            if char == '{': braces += 1
            elif char == '}': braces -= 1
            elif char == '(': parens += 1
            elif char == ')': parens -= 1
            elif char == '[': brackets += 1
            elif char == ']': brackets -= 1
            
            if braces < 0: print(f"Unmatched }} at index {i}")
            if parens < 0: print(f"Unmatched ) at index {i}")
            if brackets < 0: print(f"Unmatched ] at index {i}")
            
    print(f"Final counts: braces={braces}, parens={parens}, brackets={brackets}")

check_balance(sys.argv[1])
