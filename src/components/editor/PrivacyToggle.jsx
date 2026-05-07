import './PrivacyToggle.css'

export function PrivacyToggle({ fieldName, privateFlags, onChange }) {
  const isPrivate = !!privateFlags?.[fieldName]
  return (
    <button
      type="button"
      className={`privacy-toggle ${isPrivate ? 'private' : 'public'}`}
      title={isPrivate ? 'Hidden from viewers — click to make public' : 'Visible to viewers — click to make private'}
      onClick={() => onChange(fieldName, !isPrivate)}
    >
      {isPrivate ? '🔒' : '🔓'}
    </button>
  )
}
