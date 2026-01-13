import { useNavigate } from 'react-router-dom';
import { RiskForm } from '../components/form';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { getNextRiskId } from '../utils/risk';

export default function NewRiskEntry() {
  const navigate = useNavigate();
  const { risks, addRisk } = useRisks();

  const handleSubmit = (payload) => {
    addRisk({
      id: getNextRiskId(risks),
      createdAt: new Date().toISOString(),
      ...payload,
    });
    navigate('/risks');
  };

  return (
    <>
      <ContentHeader
        title="New Risk Entry"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Risk Register', path: '/risks' },
          { label: 'New Risk Entry' },
        ]}
      />

      <Card
        title="Risk Entry Form"
        collapsible
        outline
        color="primary"
      >
        <RiskForm onSubmit={handleSubmit} submitLabel="Create risk" simplified={true} />
      </Card>
    </>
  );
}
