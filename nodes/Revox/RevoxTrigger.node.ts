import {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class RevoxTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Revox Trigger',
		name: 'revoxTrigger',
		icon: 'file:../../icons/revox.svg',
		group: ['trigger'],
		usableAsTool: true,
		version: 1,
		subtitle: '=Trigger on call completion',
		description: 'Triggers when a Revox AI call completes',
		defaults: {
			name: 'Revox Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Info',
				name: 'info',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {},
				},
			},
			{
				displayName: 'Filter by Result',
				name: 'filterByResult',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Human',
						value: 'human',
					},
					{
						name: 'Voicemail',
						value: 'voicemail',
					},
					{
						name: 'IVR',
						value: 'IVR',
					},
				],
				default: 'all',
				description: 'Filter which call results trigger this workflow',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const filterByResult = this.getNodeParameter('filterByResult', 0) as string;

		// Filter based on result if specified
		if (filterByResult !== 'all' && bodyData.result !== filterByResult) {
			return {
				noWebhookResponse: true,
			};
		}

		const webhookUrl = this.getNodeWebhookUrl('default');

		// Return the webhook data to the workflow
		return {
			workflowData: [
				[
					{
						json: {
							call_order_id: bodyData.call_order_id,
							call_id: bodyData.call_id,
							status: bodyData.status,
							result: bodyData.result,
							annotation: bodyData.annotation,
							transcript: bodyData.transcript,
							recording_url: bodyData.recording_url,
							started_at: bodyData.started_at,
							ended_at: bodyData.ended_at,
							calls_count: bodyData.calls_count,
							timestamp: new Date().toISOString(),
							webhookUrl,
						},
					},
				],
			],
		};
	}
}
