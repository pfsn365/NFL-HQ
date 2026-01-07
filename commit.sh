#!/bin/bash
cd "/Users/frago/Desktop/NFL HQ"
git add components/TeamPage.tsx components/tabs/OverviewTab.tsx app/page.tsx
git commit -m "Optimize API calls and update homepage for NFL

API Optimizations:
- Lift schedule and standings data from TeamPage to OverviewTab via props
- Reduce duplicate API calls from 10 to 5 on overview tab
- Fix widget box heights to 430px to prevent layout shift during loading
- Display W/L result and score on same line in schedule widget

Homepage Updates:
- Replace NBA team mappings with all 32 NFL teams
- Update stat leaders section from NBA stats to NFL stats (Passing, Rushing, Receiving, Sacks, Interceptions)
- Fix team count from '30 NFL teams' to '32 NFL teams'
- Add fallback message for stat leaders with link to full stats page
- Improve skeleton loading states for NFL stats

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push
