import { useState } from 'preact/hooks';
import { ApiClient } from '../../lib/api';
import { TablesList } from './TablesList';
import { CreateTableModal } from './CreateTableModal';
import { VisualTableBuilder } from './VisualTableBuilder';
import { EditTableModal } from './EditTableModal';

interface TablesViewProps {
  apiClient: ApiClient;
  onTableSelect: (tableName: string) => void;
}

export function TablesView({ apiClient, onTableSelect }: TablesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTableName, setEditingTableName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditTable = (tableName: string) => {
    setEditingTableName(tableName);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <TablesList
        key={refreshKey}
        apiClient={apiClient}
        onTableSelect={onTableSelect}
        onCreateTable={() => setIsCreateModalOpen(true)}
        onVisualBuilder={() => setIsVisualBuilderOpen(true)}
        onEditTable={handleEditTable}
      />

      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        apiClient={apiClient}
        onSuccess={handleCreateSuccess}
      />

      <VisualTableBuilder
        isOpen={isVisualBuilderOpen}
        onClose={() => setIsVisualBuilderOpen(false)}
        apiClient={apiClient}
        onSuccess={handleCreateSuccess}
      />

      {isEditModalOpen && (
        <EditTableModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          apiClient={apiClient}
          tableName={editingTableName}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
