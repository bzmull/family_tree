import { PrivacyToggle } from './PrivacyToggle'
import './PersonForm.css'

const GENDERS = [
  { value: '', label: 'Not specified' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

function Field({ label, fieldName, privateFlags, onPrivacyChange, children }) {
  return (
    <div className="pf-field">
      <div className="pf-label-row">
        <label className="pf-label">{label}</label>
        {onPrivacyChange && (
          <PrivacyToggle
            fieldName={fieldName}
            privateFlags={privateFlags}
            onChange={onPrivacyChange}
          />
        )}
      </div>
      {children}
    </div>
  )
}

export function PersonForm({ person, branches, onChange }) {
  const update = (key, value) => onChange({ ...person, [key]: value })

  const updatePrivacy = (fieldName, isPrivate) => {
    onChange({
      ...person,
      private: { ...(person.private ?? {}), [fieldName]: isPrivate },
    })
  }

  const updateCustomField = (key, value) => {
    onChange({
      ...person,
      customFields: { ...(person.customFields ?? {}), [key]: value },
    })
  }

  const addCustomField = () => {
    const key = prompt('Field name (e.g. "Hometown"):')
    if (key?.trim()) updateCustomField(key.trim(), '')
  }

  return (
    <div className="pf-form">
      <div className="pf-row">
        <Field label="First name" fieldName="firstName">
          <input className="pf-input" value={person.firstName ?? ''} onChange={(e) => update('firstName', e.target.value)} />
        </Field>
        <Field label="Last name" fieldName="lastName">
          <input className="pf-input" value={person.lastName ?? ''} onChange={(e) => update('lastName', e.target.value)} />
        </Field>
      </div>

      <Field label="Maiden name" fieldName="maidenName">
        <input className="pf-input" value={person.maidenName ?? ''} onChange={(e) => update('maidenName', e.target.value || null)} />
      </Field>

      <div className="pf-row">
        <Field label="Gender" fieldName="gender">
          <select className="pf-input" value={person.gender ?? ''} onChange={(e) => update('gender', e.target.value || undefined)}>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="Living?" fieldName="isLiving">
          <select className="pf-input" value={person.isLiving ? 'yes' : 'no'} onChange={(e) => update('isLiving', e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No (deceased)</option>
          </select>
        </Field>
      </div>

      <div className="pf-row">
        <Field label="Birth date" fieldName="birthDate" privateFlags={person.private} onPrivacyChange={updatePrivacy}>
          <input type="date" className="pf-input" value={person.birthDate ?? ''} onChange={(e) => update('birthDate', e.target.value || null)} />
        </Field>
        {!person.isLiving && (
          <Field label="Death date" fieldName="deathDate">
            <input type="date" className="pf-input" value={person.deathDate ?? ''} onChange={(e) => update('deathDate', e.target.value || null)} />
          </Field>
        )}
      </div>

      <div className="pf-row">
        <Field label="Birth place" fieldName="birthPlace" privateFlags={person.private} onPrivacyChange={updatePrivacy}>
          <input className="pf-input" value={person.birthPlace ?? ''} onChange={(e) => update('birthPlace', e.target.value)} />
        </Field>
        {!person.isLiving && (
          <Field label="Death place" fieldName="deathPlace">
            <input className="pf-input" value={person.deathPlace ?? ''} onChange={(e) => update('deathPlace', e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Occupation" fieldName="occupation">
        <input className="pf-input" value={person.occupation ?? ''} onChange={(e) => update('occupation', e.target.value)} />
      </Field>

      <Field label="Biography" fieldName="bio" privateFlags={person.private} onPrivacyChange={updatePrivacy}>
        <textarea className="pf-input pf-textarea" value={person.bio ?? ''} onChange={(e) => update('bio', e.target.value)} rows={3} />
      </Field>

      <Field label="Private notes (editors only)" fieldName="privateNotes">
        <textarea className="pf-input pf-textarea" value={person.privateNotes ?? ''} onChange={(e) => update('privateNotes', e.target.value)} rows={2} />
      </Field>

      <div className="pf-field">
        <label className="pf-label">Family branches</label>
        <div className="pf-branches">
          {branches.map((b) => (
            <label key={b.id} className="pf-branch-check">
              <input
                type="checkbox"
                checked={(person.branches ?? []).includes(b.id)}
                onChange={(e) => {
                  const current = person.branches ?? []
                  update('branches', e.target.checked
                    ? [...current, b.id]
                    : current.filter((id) => id !== b.id))
                }}
              />
              <span style={{ color: b.color }}>{b.label}</span>
            </label>
          ))}
        </div>
      </div>

      {Object.keys(person.customFields ?? {}).length > 0 && (
        <div className="pf-field">
          <label className="pf-label">Custom fields</label>
          {Object.entries(person.customFields).map(([key, val]) => (
            <div key={key} className="pf-custom-field">
              <span className="pf-custom-key">{key}</span>
              <input className="pf-input pf-custom-val" value={val} onChange={(e) => updateCustomField(key, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      <button type="button" className="pf-add-custom" onClick={addCustomField}>
        + Add custom field
      </button>
    </div>
  )
}
