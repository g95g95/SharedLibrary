import { ApiVillage } from '../api';

interface Props {
  villages: ApiVillage[];
  value?: number;
  onChange: (id?: number) => void;
}

function VillageSelector({ villages, value, onChange }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}>
      <option value="">Tutte le comunità</option>
      {villages.map((village) => (
        <option value={village.id} key={village.id}>
          {village.name} {village.province ? `(${village.province})` : ''}
        </option>
      ))}
    </select>
  );
}

export default VillageSelector;
