import { useEffect, useRef, useMemo } from 'react'
import ReactFamilyTree from 'react-family-tree'
import calcTree from 'relatives-tree'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { formatLifespan } from '../../utils/ageCalculator'
import './FamilyTree.css'

const NODE_W = 220
const NODE_H = 120

function getInitials(person) {
  const first = (person.firstName ?? '')[0] ?? ''
  const last  = (person.lastName  ?? '')[0] ?? ''
  return (first + last).toUpperCase()
}

function PersonCard({ node, personById, isEditor, onPersonClick }) {
  const person = personById.get(node.id)

  const style = {
    position: 'absolute',
    width: NODE_W,
    height: NODE_H,
    transform: `translate(${node.left * (NODE_W / 2)}px, ${node.top * (NODE_H / 2)}px)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (node.placeholder || !person) {
    return <div style={style} />
  }

  const initials     = getInitials(person)
  const lifespan     = formatLifespan(person)
  const isMale       = person.gender === 'male'
  const isFemale     = person.gender === 'female'
  const avatarBorder = isMale ? '#60a5fa' : isFemale ? '#f472b6' : '#94a3b8'
  const avatarBg     = isMale   ? 'rgba(96,165,250,0.12)'
                     : isFemale ? 'rgba(244,114,182,0.12)'
                     :            'rgba(148,163,184,0.12)'
  const avatarRadius = isMale ? '6px' : '50%'
  const hasPrivate   = isEditor && Object.values(person.private ?? {}).some(Boolean)

  return (
    <div style={style} onClick={() => onPersonClick(node.id)}>
      <div className="ft-node" style={{ '--node-color': avatarBorder }}>
        <div
          className="ft-avatar"
          style={{ background: avatarBg, borderColor: avatarBorder, borderRadius: avatarRadius }}
        >
          <span className="ft-initials" style={{ color: avatarBorder }}>{initials}</span>
        </div>
        <div className="ft-info">
          <div className="ft-name">{person.firstName ?? ''} {person.lastName ?? ''}</div>
          {lifespan && <div className="ft-lifespan">{lifespan}</div>}
        </div>
        {hasPrivate && <div className="ft-lock">🔒</div>}
      </div>
    </div>
  )
}

const nodePx = (node, minL, minT) => ({
  x: (node.left - minL) * (NODE_W / 2) + NODE_W / 2,
  y: (node.top  - minT) * (NODE_H / 2) + NODE_H / 2,
})

export function FamilyTree({
  nodes,
  personById,
  isEditor,
  rootPersonId,
  onPersonClick,
  controlRef,
}) {
  const apiRef = useRef(null)

  useEffect(() => {
    if (controlRef) controlRef.current = apiRef.current
  })

  useEffect(() => {
    apiRef.current?.centerView(0.8, 400)
  }, [rootPersonId])

  const layoutNodes = useMemo(
    () => (nodes?.length && rootPersonId ? calcTree(nodes, { rootId: rootPersonId }).nodes : []),
    [nodes, rootPersonId]
  )

  const divorcedPairs = useMemo(() => {
    if (!layoutNodes.length) return []
    const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]))
    const seen = new Set()
    const pairs = []
    for (const node of layoutNodes) {
      for (const spouse of (node.spouses ?? [])) {
        if (spouse.type !== 'divorced') continue
        const key = [node.id, spouse.id].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
        const other = nodeMap.get(spouse.id)
        if (other) pairs.push([node, other])
      }
    }
    return pairs
  }, [layoutNodes])

  const minLeft = useMemo(() => layoutNodes.length ? Math.min(...layoutNodes.map((n) => n.left)) : 0, [layoutNodes])
  const minTop  = useMemo(() => layoutNodes.length ? Math.min(...layoutNodes.map((n) => n.top))  : 0, [layoutNodes])
  const treeW = useMemo(() => layoutNodes.length ? (Math.max(...layoutNodes.map((n) => n.left)) - Math.min(...layoutNodes.map((n) => n.left))) * (NODE_W / 2) + NODE_W : 0, [layoutNodes])
  const treeH = useMemo(() => layoutNodes.length ? (Math.max(...layoutNodes.map((n) => n.top))  - Math.min(...layoutNodes.map((n) => n.top)))  * (NODE_H / 2) + NODE_H : 0, [layoutNodes])

  if (!nodes?.length || !rootPersonId) return null

  return (
    <div className="ft-wrapper">
      <TransformWrapper
        minScale={0.1}
        maxScale={3}
        initialScale={0.8}
        centerOnInit
        smooth
        wheel={{ step: 0.03 }}
        doubleClick={{ disabled: true }}
        onInit={(api) => {
          apiRef.current = api
          if (controlRef) controlRef.current = api
        }}
      >
        <TransformComponent wrapperClass="ft-transform-wrapper">
          <div style={{ position: 'relative' }}>
            <ReactFamilyTree
              nodes={nodes}
              rootId={rootPersonId}
              width={NODE_W}
              height={NODE_H}
              className="ft-tree"
              renderNode={(node) => (
                <PersonCard
                  key={node.id}
                  node={node}
                  personById={personById}
                  isEditor={isEditor}
                  onPersonClick={onPersonClick}
                />
              )}
            />
            {divorcedPairs.length > 0 && (
              <svg
                style={{
                  position: 'absolute',
                  top: minTop * (NODE_H / 2),
                  left: minLeft * (NODE_W / 2),
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
                width={treeW}
                height={treeH}
              >
                {divorcedPairs.map(([a, b]) => {
                  const pa = nodePx(a, minLeft, minTop)
                  const pb = nodePx(b, minLeft, minTop)
                  const dx = pb.x - pa.x
                  const dy = pb.y - pa.y
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  const ux = dx / dist
                  const uy = dy / dist
                  const margin = 90
                  return (
                    <line
                      key={`${a.id}|${b.id}`}
                      x1={pa.x + ux * margin} y1={pa.y + uy * margin}
                      x2={pb.x - ux * margin} y2={pb.y - uy * margin}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="8,5"
                      opacity={0.55}
                    />
                  )
                })}
              </svg>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
