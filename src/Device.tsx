import './device.css'

function Housing({ lower = false }: { lower?: boolean }) {
  return (
    <div className={'kalos-housing' + (lower ? ' kalos-housing--lower' : '')}>
      <i className="kalos-rim" />
      <i className="kalos-screw" />
    </div>
  )
}

export default function Device() {
  return (
    <div className="kalos-illustration" role="img" aria-label="Pokédex de Kalos aberta, com Greninja no visor">
      <div className="kalos-unit" aria-hidden="true">
        <div className="kalos-glass">
          <div className="kalos-reticle" />
          <div className="kalos-readout">N° 0658</div>
          <img className="kalos-specimen" src="/art/greninja.png" width="475" height="475" alt="" />
          <div className="kalos-caption">GRENINJA</div>
        </div>
        <Housing />
        <Housing lower />
      </div>
    </div>
  )
}
