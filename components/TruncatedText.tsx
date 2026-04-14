'use client'

import { useState, ReactNode } from 'react'

interface TruncatedTextProps {
  text: string
  maxChars: number
  renderText: (text: string) => ReactNode  // Receives the (possibly-truncated) text, returns JSX.
                                            // Lets callers pass their own mention-rendering / link-rendering logic.
  readMoreStyle?: React.CSSProperties
  readMoreColor?: string
}

export default function TruncatedText({
  text,
  maxChars,
  renderText,
  readMoreStyle,
  readMoreColor = '#6366f1',
}: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false)

  if (!text) return null

  const needsTruncation = text.length > maxChars
  const displayText = needsTruncation && !expanded
    ? text.substring(0, maxChars).trimEnd() + '…'
    : text

  return (
    <>
      {renderText(displayText)}
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: readMoreColor,
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
            display: 'block',
            ...readMoreStyle,
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  )
}