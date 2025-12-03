import { useState } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { TablesList } from './TablesList';
import { CreateTableModal } from './CreateTableModal';

interface TablesViewProps {
  apiClient: ApiClient;
  onTableSelect: (tableName: string) => void;
}

export function TablesView({ apiClient, onTableSelect }: TablesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <TablesList
        key={refreshKey}
        apiClient={apiClient}
        onTableSelect={onTableSelect}
        onCreateTable={() => setIsCreateModalOpen(true)}
      />

      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        apiClient={apiClient}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
