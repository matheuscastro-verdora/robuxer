import { QRCodeSVG } from 'qrcode.react'

export function PixQr({ payload }: { payload: string }) {
	return (
		<div className="flex flex-col items-center gap-2">
			<QRCodeSVG value={payload} width={192} height={192} />
			<div className="text-xs text-muted-foreground break-all">{payload}</div>
		</div>
	)
}
