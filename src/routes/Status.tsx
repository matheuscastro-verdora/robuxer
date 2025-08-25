import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrderStatus } from '../lib/api'
import { Layout } from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Stepper } from '../components/Stepper'
import { StatusBadge } from '../components/StatusBadge'
import { formatRelative } from '../lib/format'
import { toast } from 'sonner'

export default function Status() {
	const { orderId } = useParams<{ orderId: string }>()
	const { data, isLoading, dataUpdatedAt } = useQuery({
		queryKey: ['order', orderId],
		queryFn: () => getOrderStatus(orderId!),
		refetchInterval: 5000,
		enabled: !!orderId,
	})

	const last = dataUpdatedAt ? formatRelative(new Date(dataUpdatedAt)) : ''
	const payout = data?.payouts?.[0]

	return (
		<Layout>
			<div className="max-w-2xl space-y-6">
				<Card>
					<CardHeader className="flex items-center justify-between">
						<CardTitle>Status do pedido</CardTitle>
						{orderId && (
							<button className="border rounded px-2 py-1 text-sm" onClick={()=>{navigator.clipboard.writeText(orderId); toast.success('ID copiado')}}>Copiar ID</button>
						)}
					</CardHeader>
					<CardContent>
						{isLoading || !data?.order ? (
							<div>Carregando...</div>
						) : (
							<div className="space-y-4">
								<div className="text-xs text-muted-foreground">Última atualização {last}</div>
								<div className="flex items-center gap-2 text-sm">
									<span>Pagamento:</span>
									<StatusBadge status={data.order.payment_status} />
								</div>
								<div className="flex items-center gap-2 text-sm">
									<span>Elegibilidade:</span>
									<StatusBadge status={data.user?.is_eligible ? 'elegível' : 'aguardando'} />
									{!data.user?.is_eligible && data.user?.eligible_at && (
										<span className="text-muted-foreground">até {new Date(data.user.eligible_at).toLocaleString()}</span>
									)}
								</div>
								<div className="flex items-center gap-2 text-sm">
									<span>Payout:</span>
									<StatusBadge status={payout?.status ?? '-'} />
									{payout?.status === 'retry' && (
										<span className="text-muted-foreground">Tentaremos novamente automaticamente.</span>
									)}
								</div>
								<div className="pt-2">
									<Stepper
										steps={["Pagamento", "Elegibilidade", "Payout", "Concluído"]}
										activeIndex={
											data.order.payment_status !== 'paid' ? 0 : !data.user?.is_eligible ? 1 : (payout?.status === 'ok' ? 3 : 2)
										}
									/>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</Layout>
	)
}
