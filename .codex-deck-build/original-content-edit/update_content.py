from pathlib import Path
from xml.sax.saxutils import escape
import re

ROOT = Path('/Users/kimhoong0324/Desktop/BursaIQ-main/.codex-deck-build/original-content-edit/unpacked')

updates = {
    1: {
        0: 'THE PROPOSED SOLUTION', 1: 'BursaIQ', 2: 'One workspace. A hybrid AI workforce. Governed intelligence.',
        3: 'BursaIQ', 4: ' combines Microsoft AI services with self-hosted', 5: ' open-source models',
        6: ', specialist', 7: '', 8: ' AI workers, trusted knowledge and human oversight.',
        9: 'HYBRID AI', 10: 'Microsoft services and ', 11: 'l', 12: 'ocal open-source models in one workspace',
        13: 'AI WORKFORCE', 14: 'Specialist agents for ', 15: 'knowledge, analysis and delivery',
        16: 'GOVERNED KNOWLEDGE', 17: 'Trusted internal sources and reusable intelligence',
        18: 'HUMAN CONTROL', 19: 'Verification, approvals and audit-ready delivery',
    },
    2: {
        0: '06 · THE PROPOSED EXPERIENCE', 8: 'BursaIQ presents one governed AI workforce powered by two complementary model paths.',
        9: 'Microsoft providers support connected enterprise experiences; self-hosted models provide local control and choice.',
        11: 'Hybrid model choice', 12: 'Select Microsoft or local open-source AI according to the work, policy and operating context.',
        14: 'One AI workforce experience', 15: 'Users work with specialist agents without managing separate tools or model interfaces.',
        17: 'Trusted knowledge and evidence', 18: 'Answers and deliverables remain grounded in approved knowledge and traceable sources.',
        20: 'Human oversight and reuse', 21: 'People review important outputs before the organisation publishes or reuses them.',
        22: 'Proposed architecture: a shared BursaIQ governance layer across Microsoft AI services and self-hosted ',
        23: 'open-source models', 24: ', with one experience for users and reviewers.',
        30: 'My Workforce', 31: 'AI missions and specialist workers', 33: 'Intelligence Exchange', 34: 'Approved insights and reuse',
        36: 'AI Assistant', 37: 'Everyday support and insight', 39: 'Ask Bursa', 40: 'Trusted internal knowledge',
        42: 'Verification Centre', 43: 'Human review and approval', 45: 'Administration', 46: 'Models, access and governance',
    },
    4: {
        0: '10 · THE HYBRID EXPERIENCE', 1: 'One platform. Two model paths. One governance layer.',
        2: 'BursaIQ gives users a consistent AI workforce experience while the organisation chooses the right provider for each context.',
        3: 'WORKFORCE', 4: 'My Workforce', 5: 'Coordinate specialist AI workers across Microsoft and local model paths.',
        6: 'MISSIONS', 7: 'INTELLIGENCE', 8: 'Intelligence Exchange', 9: 'Publish approved insights and reuse them with clear provenance.',
        10: 'KNOWLEDGE', 11: 'INTELLIGENCE', 12: 'Ask Bursa', 13: 'Answer internal questions from trusted knowledge and access controls.',
        14: 'ASSISTANT', 15: 'AI Assistant', 16: 'Support everyday work through the model path that best fits the request.',
        17: 'GOVERNANCE', 18: 'Verification Centre', 19: 'Keep people responsible for review, refinement and approval.',
        20: 'GOVERNANCE', 21: 'Administration', 22: 'Set model availability, access policies and approved knowledge.',
        23: 'Microsoft services provide connected enterprise experiences; self-hosted ', 24: 'open-source AI models',
        25: ' provide local control. ', 26: 'B', 27: 'ursaIQ applies the same governance across both.',
        32: 'KNOWLEDGE', 33: 'MODEL CHOICE', 34: 'GOVERNANCE',
    },
    5: {
        0: '12 · THE HYBRID MODEL', 1: 'BursaIQ combines provider choice with consistent control',
        2: 'Microsoft AI services and self-hosted open-source models operate as complementary options inside one governed workspace.',
        3: 'Microsoft AI Services', 4: 'Self-hosted Open Source', 5: 'BursaIQ Governance',
        6: 'Best fit', 7: '✓', 8: 'Connected enterprise experiences', 9: '✓', 10: 'Local and controlled processing', 11: '✓', 12: 'Routes work by context and policy',
        13: 'Deployment choice', 14: '✓', 15: 'Managed Microsoft ecosystem', 16: '✓', 17: 'Bursa-controlled environment', 18: '✓', 19: 'One consistent user experience',
        20: 'Knowledge', 21: '✓', 22: 'Approved enterprise sources', 23: '✓', 24: 'Approved local sources', 25: '✓', 26: 'Common source and evidence controls',
        27: 'Oversight', 28: '✓', 29: 'Enterprise identity and channels', 30: '✓', 31: 'Local model and data control', 32: '✓', 33: 'Human review and audit',
        34: 'Continuity', 35: '✓', 36: 'Configured Microsoft availability', 37: '✓', 38: 'Independent local model option', 39: '✓', 40: 'Visible provider status and choice',
        41: 'Strategic role', 42: '✓', 43: 'Connected cloud capability', 44: '✓', 45: 'Control over selected workloads', 46: '✓',
        47: 'A shared ', 48: 'governance ', 49: 'layer across both paths',
        50: 'The proposal supports a hybrid model strategy without splitting the user experience or governance model.',
    },
}

pattern = re.compile(r'<a:t>(.*?)</a:t>', re.DOTALL)
for slide_num, replacements in updates.items():
    path = ROOT / f'ppt/slides/slide{slide_num}.xml'
    text = path.read_text(encoding='utf-8')
    counter = {'i': 0}
    def repl(match):
        i = counter['i']; counter['i'] += 1
        value = replacements.get(i, match.group(1))
        return f'<a:t>{escape(value)}</a:t>'
    revised = pattern.sub(repl, text)
    path.write_text(revised, encoding='utf-8')

