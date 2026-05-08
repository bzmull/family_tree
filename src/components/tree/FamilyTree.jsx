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

  const buildCard = useCallback((branches, isEditor) => {
    return (d) => {
      const person = d.data.data
      if (!person) return '<div class="ft-node ft-node--empty"></div>'

      const color = getBranchColor(person, branches)
      const lifespan = formatLifespan(person)
      const initials = getInitials(person)
      const bridge = isBridgePerson(person, branches ?? [])
      const hasPrivate = isEditor && Object.values(person.private ?? {}).some(Boolean)

      return `
        <div class="ft-node" style="--node-color:${color}" data-id="${person.id}">
          <div class="ft-avatar" style="background:${color}20;border-color:${color}">
            <span class="ft-initials" style="color:${color}">${initials}</span>
          </div>
          <div class="ft-info">
            <div class="ft-name">${person.firstName} ${person.lastName}${person.maidenName ? ` <span class="ft-maiden">(${person.maidenName})</span>` : ''}</div>
            ${lifespan ? `<div class="ft-lifespan">${lifespan}</div>` : ''}
            ${bridge ? '<div class="ft-bridge-badge">⇔ Bridge</div>' : ''}
          </div>
          ${hasPrivate ? '<div class="ft-lock" title="Has private fields">🔒</div>' : ''}
        </div>
      `
    }
  }, [])

  const hasData = (nodes?.length ?? 0) > 0

  // Mount chart once data is first available
  useEffect(() => {
    if (!containerRef.current || !hasData || chartRef.current) return

    const chart = createChart(containerRef.current, nodes)
    const card = chart.setCardHtml()

    // card_dim controls foreignObject size; must match .ft-node CSS
    card.card_dim = { w: 190, h: 72, text_x: 0, text_y: 0, img_w: 0, img_h: 0, img_x: 0, img_y: 0 }

    card.setCardInnerHtmlCreator((d) => {
      // f3 node shape: { id, data: {...personFields}, rels }  — person fields are at d.data.data
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

    card.onCardClick = (e, d) => {
      if (!onPersonClick) return
      if (d?.data?.data?.isVirtual) return
      if (d?.data?.id) onPersonClick(d.data.id)
    }

    chart.setTransitionTime(600)
    chart.updateTree({ initial: true })
    chartRef.current = chart

    return () => {
      chartRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [hasData]) // re-run when data first arrives

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

  const handleZoomIn = () => {
    const svg = containerRef.current?.querySelector('svg.main_svg')
    if (!svg) return
    const current = svg.__zoom?.k ?? 1
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }))
  }

  const handleZoomOut = () => {
    const svg = containerRef.current?.querySelector('svg.main_svg')
    if (!svg) return
    svg.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }))
  }

  const handleFitScreen = () => {
    if (!chartRef.current) return
    chartRef.current.updateTree({ initial: false, tree_position: 'fit' })
  }

  return (
    <div className="ft-wrapper">
      <div ref={containerRef} className="ft-container" id="FamilyChart" />
    </div>
  )
}
