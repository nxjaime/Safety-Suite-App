# Master Agent Skills List

Use these commands to add essential agent skills to any workspace. These skills allow for a consistent experience across projects.

## Superpowers (Workflow & Engineering)
These provide the core workflow for planning, TDD, and debugging.
```bash
npx skills add https://github.com/obra/superpowers.git --skill brainstorming -y && \
npx skills add https://github.com/obra/superpowers.git --skill dispatching-parallel-agents -y && \
npx skills add https://github.com/obra/superpowers.git --skill executing-plans -y && \
npx skills add https://github.com/obra/superpowers.git --skill finishing-a-development-branch -y && \
npx skills add https://github.com/obra/superpowers.git --skill receiving-code-review -y && \
npx skills add https://github.com/obra/superpowers.git --skill requesting-code-review -y && \
npx skills add https://github.com/obra/superpowers.git --skill subagent-driven-development -y && \
npx skills add https://github.com/obra/superpowers.git --skill writing-plans -y && \
npx skills add https://github.com/obra/superpowers.git --skill systematic-debugging -y && \
npx skills add https://github.com/obra/superpowers.git --skill test-driven-development -y && \
npx skills add https://github.com/obra/superpowers.git --skill verification-before-completion -y && \
npx skills add https://github.com/obra/superpowers.git --skill using-git-worktrees -y && \
npx skills add https://github.com/obra/superpowers.git --skill using-superpowers -y && \
npx skills add https://github.com/obra/superpowers.git --skill writing-skills -y
```

## Community & Security Skills
Powerful tools from the community for specific tasks like fuzzing, D3, and security audits.
```bash
npx skills add https://github.com/conorluddy/ios-simulator-skill -y && \
npx skills add https://github.com/jthack/ffuf_claude_skill -y && \
npx skills add https://github.com/lackeyjb/playwright-skill -y && \
npx skills add https://github.com/chrisvoncsefalvay/claude-d3js-skill -y && \
npx skills add https://github.com/K-Dense-AI/claude-scientific-skills -y && \
npx skills add https://github.com/alonw0/web-asset-generator -y && \
npx skills add https://github.com/asklokesh/claudeskill-loki-mode -y && \
npx skills add https://github.com/trailofbits/skills -y
```

## Official Anthropic Skills
Core document processing and UI design patterns.
```bash
npx skills add https://github.com/anthropics/skills --skill docx -y && \
npx skills add https://github.com/anthropics/skills --skill pdf -y && \
npx skills add https://github.com/anthropics/skills --skill pptx -y && \
npx skills add https://github.com/anthropics/skills --skill xlsx -y && \
npx skills add https://github.com/anthropics/skills --skill algorithmic-art -y && \
npx skills add https://github.com/anthropics/skills --skill canvas-design -y && \
npx skills add https://github.com/anthropics/skills --skill slack-gif-creator -y && \
npx skills add https://github.com/anthropics/skills --skill frontend-design -y && \
npx skills add https://github.com/anthropics/skills --skill web-artifacts-builder -y && \
npx skills add https://github.com/anthropics/skills --skill mcp-builder -y && \
npx skills add https://github.com/anthropics/skills --skill webapp-testing -y && \
npx skills add https://github.com/anthropics/skills --skill brand-guidelines -y && \
npx skills add https://github.com/anthropics/skills --skill internal-comms -y && \
npx skills add https://github.com/anthropics/skills --skill skill-creator -y
```

## Vercel Labs & Community (Original)
```bash
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -y && \
npx skills add https://github.com/vercel-labs/agent-browser --skill skill-creator -y && \
npx skills add https://github.com/vercel-labs/skills --skill find-skills -y && \
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns -y && \
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices -y && \
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills -y && \
npx skills add https://github.com/softaworks/agent-toolkit --skill gemini -y && \
npx skills add https://github.com/softaworks/agent-toolkit --skill session-handoff -y && \
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -y && \
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill senior-fullstack -y && \
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill software-architecture -y && \
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill github-workflow-automation -y && \
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill nextjs-supabase-auth -y && \
npx skills add https://github.com/affaan-m/everything-claude-code --skill coding-standards -y
```

## Fast Global Installation
Run the following script in any new workspace to install the complete suite (~240 skills) in one go.

```bash
~/install_global_skills.sh
```

*(Note: Ensure you have granted execute permissions: `chmod +x ~/install_global_skills.sh`)*
