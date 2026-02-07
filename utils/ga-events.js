export const GA_MEASUREMENT_ID = 'G-94BYBHMYCW'

export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

const trackViewItem = (itemId, itemName, itemCategory) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'USD',
      value: 0,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory,
          quantity: 1,
        },
      ],
    })
  }
}

const trackSelectContent = (contentType, itemId) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'select_content', {
      content_type: contentType,
      item_id: itemId,
    })
  }
}

export const trackPageEngagement = (engagementTime) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      engagement_time_msec: engagementTime,
    })
  }
}

// NFL-specific tracking events
export const trackTeamView = (teamId, teamName) => {
  trackViewItem(teamId, teamName, 'NFL Team')
}

export const trackTabChange = (tabName, teamId) => {
  trackSelectContent('team_tab', `${teamId}_${tabName}`)
}

export const trackScheduleView = (teamId, season) => {
  event({
    action: 'view_schedule',
    category: 'team_content',
    label: `${teamId}_${season}`,
  })
}

export const trackNewsClick = (articleTitle, teamId) => {
  event({
    action: 'click_news_article',
    category: 'content_engagement',
    label: `${teamId}_${articleTitle}`,
  })
}

export const trackStandingsView = (division) => {
  event({
    action: 'view_standings',
    category: 'team_content',
    label: division,
  })
}
