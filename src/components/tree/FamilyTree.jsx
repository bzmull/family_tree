import { useEffect, useRef } from 'react'
import ReactFamilyTree from 'react-family-tree'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { formatLifespan } from '../../utils/ageCalculator'
import { isBridgePerson } from '../../utils/branchFilter'
import './FamilyTree.css'

// NODE_W / NODE_H define the grid step passed to ReactFamilyTree.
// Cards are 180px wide; the extra 40px (220-180) gives a 20px gap on each side.
const NODE_W = 220
const NODE_H = 120

function getInitials(person) {
  const first = (person.firstName ?? '')[0] ?? ''
  const last  = (person.lastName  ?? '')[0] ?? ''
  return (first + last).toUpperCase()
}

function getBranchColor(person, branches) {
  if (!branches?.length || !person.branches?.length) return '#64748b'
  const branch = branches.find((b) => person.branches.includes(b.id))
  return branch?.color ?? '#64748b'
}

function PersonCard({ node, personById, branches, isEditor, onPersonClick }) {
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
  const branchColor  = getBranchColor(person, branches)
  const color        = branchColor !== '#64748b' ? branchColor : avatarBorder
  const hasPrivate   = isEditor && Object.values(person.private ?? {}).some(Boolean)
  const bridge       = isBridgePerson(person, branches ?? [])

  return (
    <div style={style} onClick={() => onPersonClick(node.id)}>
      <div className="ft-node" style={{ '--node-color': color }}>
        <div
          className="ft-avatar"
          style={{ background: avatarBg, borderColor: avatarBorder, borderRadius: avatarRadius }}
        >
          <span className="ft-initials" style={{ color: avatarBorder }}>{initials}</span>
        </div>
        <div className="ft-info">
          <div className="ft-name">{person.firstName ?? ''} {person.lastName ?? ''}</div>
          {lifespan && <div className="ft-lifespan">{lifespan}</div>}
          {bridge && <div className="ft-bridge-badge">⇔</div>}
        </div>
        {hasPrivate && <div className="ft-lock">🔒</div>}
      </div>
    </div>
  )
}

export function FamilyTree({
  nodes,
  personById,
  branches,
  isEditor,
  rootPersonId,
  onPersonClick,
  controlRef,
}) {
  const apiRef = useRef(null)

  // Expose zoom API to parent (TreeControls)
  useEffect(() => {
    if (controlRef) controlRef.current = apiRef.current
  })

  // Re-centre whenever the root person changes (search / viewer click)
  useEffect(() => {
    apiRef.current?.centerView(0.8, 400)
  }, [rootPersonId])

  if (!nodes?.length || !rootPersonId) return null

  return (
    <div className="ft-wrapper">
      <TransformWrapper
        minScale={0.1}
        maxScale={3}
        initialScale={0.8}
        centerOnInit
        wheel={{ step: 0.08 }}
        doubleClick={{ disabled: true }}
        onInit={(api) => {
          apiRef.current = api
          if (controlRef) controlRef.current = api
        }}
      >
        <TransformComponent wrapperClass="ft-transform-wrapper">
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
                branches={branches}
                isEditor={isEditor}
                onPersonClick={onPersonClick}
              />
            )}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
