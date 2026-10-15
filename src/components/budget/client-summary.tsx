import { StyleSheet, Text } from 'react-native';
import type { ClientData } from '@/types/client';
import { formatClientAddress, formatPhone } from '@/utils/client';
import { BudgetCard } from './budget-card';
import { BudgetButton } from './budget-screen';

export function ClientSummary({ client, onEdit }: { client: ClientData | null; onEdit: () => void }) {
  return (
    <BudgetCard title="Cliente">
      {client ? <>
        <Text style={styles.text}>{client.name}</Text>
        {!!client.phone && <Text style={styles.text}>{formatPhone(client.phone)}</Text>}
        {formatClientAddress(client).map((line, index) => <Text key={index} style={styles.text}>{line}</Text>)}
        {!!client.complement && <Text style={styles.text}>Complemento: {client.complement}</Text>}
        {!!client.notes && <Text style={styles.text}>Observações: {client.notes}</Text>}
      </> : <Text style={styles.text}>Informe os dados do cliente.</Text>}
      <BudgetButton label="Editar cliente" onPress={onEdit} />
    </BudgetCard>
  );
}

const styles = StyleSheet.create({ text: { color: '#123D35', fontSize: 14, lineHeight: 22 } });
