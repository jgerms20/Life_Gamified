import { useState } from 'react';
import { useGame, CLASSES } from '../../context/GameContext';

export default function CharacterCreation() {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('adventurer');
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);

  function handleCreate() {
    if (!name.trim()) { setError('A hero must have a name, brave soul.'); return; }
    setSigned(true);
    setTimeout(() => {
      dispatch({
        type: 'CREATE_CHARACTER',
        payload: { name: name.trim(), title: title.trim(), class: selectedClass },
      });
    }, 600);
  }

  const classInfo = CLASSES[selectedClass];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: `
        radial-gradient(ellipse at 20% 20%, rgba(74,55,40,0.5) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(26,14,8,0.7) 0%, transparent 50%),
        #2d1b0e
      `,
    }}>
      {/* Decorative corner flourishes */}
      <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 32, opacity: 0.3 }}>✦</div>
      <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 32, opacity: 0.3 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 32, opacity: 0.3 }}>✦</div>
      <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 32, opacity: 0.3 }}>✦</div>

      <div
        className="animate-fade-in-up parchment-bg"
        style={{
          maxWidth: 540, width: '100%',
          borderRadius: '6px',
          border: '2px solid var(--brown-mid)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header band */}
        <div style={{
          background: 'linear-gradient(135deg, #2d1b0e, #1a0e08)',
          padding: '24px',
          borderBottom: '2px solid var(--gold-dark)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '11px',
            letterSpacing: '0.3em', color: 'var(--gold-dark)',
            textTransform: 'uppercase', marginBottom: '8px',
          }}>
            ✦ Guild Registration ✦
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '26px',
            color: 'var(--gold-bright)',
            textShadow: '0 0 20px rgba(255,215,0,0.4)',
            letterSpacing: '0.05em', fontWeight: 700, lineHeight: 1.2,
          }}>
            Create Your Hero
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            color: 'var(--parchment-mid)', fontSize: '15px', marginTop: '6px',
          }}>
            Sign the Quest Contract and begin your legend
          </p>
        </div>

        <div className="on-parchment" style={{ padding: '28px 32px' }}>
          {/* Hero Name */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-header)',
              fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--brown-mid)', marginBottom: '6px',
            }}>
              Hero Name *
            </label>
            <input
              className="input-base"
              placeholder="Enter your name, brave soul..."
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ fontFamily: 'var(--font-script)', fontSize: '18px' }}
            />
            {error && (
              <p style={{ color: 'var(--ink-red)', fontFamily: 'var(--font-script)', fontSize: '14px', marginTop: '4px' }}>
                ⚠ {error}
              </p>
            )}
          </div>

          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-header)',
              fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--brown-mid)', marginBottom: '6px',
            }}>
              Title <span style={{ opacity: 0.6 }}>(optional)</span>
            </label>
            <input
              className="input-base"
              placeholder="e.g. the Bold, Dragon Slayer, of the North..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ fontFamily: 'var(--font-script)', fontSize: '16px' }}
            />
          </div>

          {/* Class Selection */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block', fontFamily: 'var(--font-header)',
              fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--brown-mid)', marginBottom: '10px',
            }}>
              Choose Your Class
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
              {Object.entries(CLASSES).map(([key, cls]) => (
                <button
                  key={key}
                  onClick={() => setSelectedClass(key)}
                  style={{
                    padding: '12px 8px', borderRadius: '4px', cursor: 'pointer',
                    border: selectedClass === key ? '2px solid var(--brown-deep)' : '2px solid var(--parchment-dark)',
                    background: selectedClass === key
                      ? 'linear-gradient(135deg, #2d1b0e, #4a3728)'
                      : 'rgba(45,27,14,0.08)',
                    color: selectedClass === key ? 'var(--parchment-light)' : 'var(--brown-deep)',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{cls.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-header)', fontSize: '10px',
                    fontWeight: 600, letterSpacing: '0.05em',
                  }}>
                    {cls.label}
                  </div>
                </button>
              ))}
            </div>
            {classInfo && (
              <p style={{
                fontFamily: 'var(--font-body)', fontStyle: 'italic',
                fontSize: '14px', color: 'var(--brown-light)',
                marginTop: '10px', textAlign: 'center',
              }}>
                {classInfo.icon} {classInfo.description}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="ornament-divider" style={{ margin: '0 0 20px' }}>
            <span>⚜</span>
          </div>

          {/* Sign button */}
          <button
            className={`btn btn-dark ${signed ? 'animate-pulse-gold' : ''}`}
            onClick={handleCreate}
            style={{ width: '100%', padding: '14px', fontSize: '14px', justifyContent: 'center' }}
          >
            {signed ? '✦ Contract Signed ✦' : '✒ Sign and Accept the Quest Contract'}
          </button>

          <p style={{
            fontFamily: 'var(--font-script)', fontSize: '12px',
            color: 'var(--brown-light)', textAlign: 'center', marginTop: '12px',
          }}>
            By signing, you pledge your honour to the completion of quests
          </p>
        </div>
      </div>
    </div>
  );
}
