import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiskForm } from '../components/form';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { logger } from '../utils/logger';

export default function NewRiskEntry() {
  const navigate = useNavigate();
  const { addRisk } = useRisks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const createRisk = async (payload) => {
    try {
      setIsSubmitting(true);
      return await addRisk(payload);
    } catch (error) {
      logger.error('Error creating risk:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Membuat Risiko',
        message: 'Gagal membuat risiko: ' + (error.message || 'Unknown error'),
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (payload) => {
    const response = await createRisk(payload);
    if (response) {
      navigate('/risks');
    }
  };

  const handleSaveAndGoToAnalysis = async (payload) => {
    const response = await createRisk(payload);
    const createdRiskId = response?.risk?.id;

    if (!createdRiskId) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mengarahkan',
        message: 'Risiko tersimpan, tetapi ID risiko tidak ditemukan untuk lanjut ke Analisis.',
      });
      return;
    }

    navigate(`/risks/${createdRiskId}/risk-analysis`);
  };

  return (
    <>
      <ContentHeader
        title="Entri Risiko Baru"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Register Risiko', path: '/risks' },
          { label: 'Entri Risiko Baru' },
        ]}
      />

      <Card
        title="Formulir Entri Risiko"
        outline
        color="primary"
      >
        <RiskForm 
          onSubmit={handleSubmit} 
          submitLabel={isSubmitting ? "Menyimpan..." : "Buat Risiko"} 
          simplified={true}
          onSaveAndGoToAnalysis={handleSaveAndGoToAnalysis}
          disabled={isSubmitting}
        />
      </Card>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </>
  );
}
