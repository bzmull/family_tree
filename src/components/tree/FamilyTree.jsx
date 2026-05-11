import { useEffect, useRef, useCallback } from 'react'
import { createChart, cardHtml } from 'family-chart'
import '../../family-chart.css'
import { formatLifespan } from '../../utils/ageCalculator'
import { isBridgePerson } from '../../utils/branchFilter'
import './FamilyTree.css'

function getInitials(person) {
  const first = (person.firstName ?? '')[0] ?? ''
  const last = (person.lastName ?? '')[0] ?? ''
  return (first + last).toUpperCase()
}

function getBranchColor(person, branches) {
  if (!branches?.length || !person.branches?.length) return '#64748b'
  const branch = branches.find((b) => person.branches.includes(b.id))
  return branch?.color ?? '#64748b'
}

export function FamilyTree({ nodes, branches, onPersonClick, isEditor, rootPersonId }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  const hasData = (nodes?.length ?? 0) > 0

  // Mount chart once data is first available
  useEffect(() => {
    if (!containerRef.current || !hasData || chartRef.current) return

    const chart = createChart(containerRef.current, nodes)
    const card = chart.setCardHtml()

    card.card_dim = { w: 190, h: 72, text_x: 0, text_y: 0, img_w: 0, img_h: 0, img_x: 0, img_y: 0 }

    card.setCardInnerHtmlCreator((d) => {
      const person = d.data?.data
      if (person?.isVirtual) return '<div class="ft-node ft-node--virtual"></div>'
      if (!person) return '<div class="ft-node ft-node--empty"></div>'

      const initials = getInitials(person)
      const lifespan = formatLifespan(person)
      const isMale = person.gender === 'M'
      const isFemale = person.gender === 'F'
      const avatarBorder = isMale ? '#60a5fa' : isFemale ? '#f472b6' : '#94a3b8'
      const avatarBg = isMale ? 'rgba(96,165,250,0.12)' : isFemale ? 'rgba(244,114,182,0.12)' : 'rgba(148,163,184,0.12)'
      const avatarRadius = isMale ? '6px' : '50%'
      const branchColor = getBranchColor(person, branches)
      const color = branchColor !== '#64748b' ? branchColor : avatarBorder
      const hasPrivate = isEditor && Object.values(person.private ?? {}).some(Boolean)
      const bridge = isBridgePerson(person, branches ?? [])

      return `
        <div class="ft-node" style="--node-color:${color}">
          <div class="ft-avatar" style="background:${avatarBg};border-color:${avatarBorder};border-radius:${avatarRadius}">
            <span class="ft-initials" style="color:${avatarBorder}">${initials}</span>
          </div>
          <div class="ft-info">
            <div class="ft-name">${person.firstName ?? ''} ${person.lastName ?? ''}</div>
            ${lifespan ? `<div class="ft-lifespan">${lifespan}</div>` : ''}
            ${bridge ? '<div class="ft-bridge-badge">⇔</div>' : ''}
          </div>
          ${hasPrivate ? '<div class="ft-lock">🔒</div>' : ''}
        </div>
      `
    })

    chart.setTransitionTime(600)
    chart.updateTree({ initial: true })
    chartRef.current = chart

    return () => {
      chartRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [hasData])

  // Update data when nodes change
  useEffect(() => {
    if (!chartRef.current || !nodes?.length) return
    chartRef.current.updateData(nodes)
    chartRef.current.updateTree({ initial: false, tree_position: 'inherit' })
  }, [nodes])

  // Jump to root when rootPersonId changes
  useEffect(() => {
    if (!chartRef.current || !rootPersonId) return
    chartRef.current.store.updateMainId(rootPersonId)
    chartRef.current.updateTree({ initial: false, tree_position: 'main_to_middle' })
  }, [rootPersonId])

  // Chrome doesn't hit-test into zero-size transformed elements (.cards_view has
  // width:0/height:0), so clicks land on #htmlSvg instead of .card children.
  // getBoundingClientRect() does return the correct visual rect, so we use
  // position-based detection to find which card was clicked.
  const handleClick = useCallback((e) => {
    if (!onPersonClick) return
    const cards = containerRef.current?.querySelectorAll('#htmlSvg .card[data-id]')
    if (!cards?.length) return
    for (const card of cards) {
      const r = card.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top  && e.clientY <= r.bottom) {
        if (card.querySelector('.ft-node--virtual')) continue
        const id = card.getAttribute('data-id').replace(/--x\d+$/, '')
        onPersonClick(id)
        return
      }
    }
  }, [onPersonClick])

  return (
    <div className="ft-wrapper">
      <div
        ref={containerRef}
        className="ft-container"
        id="FamilyChart"
        onClick={handleClick}
      />
    </div>
  )
}
