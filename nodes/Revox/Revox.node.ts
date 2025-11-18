import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class Revox implements INodeType {
	methods = {
		loadOptions: {
			async getVoices(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('revoxApi');
				const baseUrl = credentials.baseUrl as string;
				const apiKey = credentials.apiKey as string;

				let response: {
					voices?: Array<{
						id: string;
						name: string;
						provider: string;
						language: string;
					}>;
				};
				try {
					response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/voices`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						json: true,
					});
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error, {
						message: 'Failed to load voices from Revox API',
					});
				}

				const voices = Array.isArray(response?.voices) ? response.voices : [];

				return voices.map((voice) => {
					const label = voice.name;
					const suffix = voice.language ? ` (${voice.language})` : '';
					return {
						name: `${label}${suffix}`,
						value: `${voice.provider}:${voice.id}`,
					};
				});
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Revox',
		name: 'revox',
		icon: 'file:../../icons/revox.svg',
		usableAsTool: true,
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Revox AI calling API',
		defaults: {
			name: 'Revox',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'revoxApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Place Call',
						value: 'placeCall',
						description: 'Place a new AI call',
						action: 'Place a call',
					},
					{
						name: 'Get Call',
						value: 'getCall',
						description: 'Get details of a specific call',
						action: 'Get a call',
					},
					{
						name: 'Get Call History',
						value: 'getCallHistory',
						description: 'Get list of calls',
						action: 'Get call history',
					},
				],
				default: 'placeCall',
			},
			// Place Call parameters
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['placeCall'],
					},
				},
				default: '',
				required: true,
				placeholder: '+1 555 555 5555',
				description: 'The phone number to call in E.164 format',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						operation: ['placeCall'],
					},
				},
				default:
					'You are a helpful voice AI assistant. You eagerly assist users with their questions by providing information from your extensive knowledge. Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols. You are curious, friendly, and have a sense of humor.',
				placeholder: 'You are a friendly assistant calling to...',
				description:
					'The system prompt for the AI agent. If not provided, uses a default helpful assistant prompt.',
			},
			{
				displayName: 'Force Now',
				name: 'forceNow',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['placeCall'],
					},
				},
				default: true,
				description: 'Whether to place the call immediately, bypassing time zone checks',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['placeCall'],
					},
				},
				default: '',
				placeholder: "={{ $node[\"Revox Trigger\"].webhookUrl }}",
				hint: 'Use an expression to reference a Revox Trigger node, or enter a custom webhook URL',
				description:
					'Optional webhook URL to receive call completion notifications. Typically referenced from a Revox Trigger node in this workflow.',
			},
			{
				displayName: 'Voice Name or ID',
				name: 'voice',
				type: 'options',
				default: '',
				typeOptions: {
					loadOptionsMethod: 'getVoices',
				},
				displayOptions: {
					show: {
						operation: ['placeCall'],
					},
				},
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			// Get Call parameters
			{
				displayName: 'Call ID',
				name: 'callId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['getCall'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the call to retrieve',
			},
			// Get Call History parameters
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getCallHistory'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getCallHistory'],
					},
				},
				default: 10,
				description: 'Number of calls per page',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);

		const credentials = await this.getCredentials('revoxApi');
		const baseUrl = credentials.baseUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'placeCall') {
					const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
					const prompt = this.getNodeParameter('prompt', i) as string;
					const forceNow = this.getNodeParameter('forceNow', i) as boolean;
					const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
					const voiceSelection = this.getNodeParameter('voice', i, '') as string;

					const body: Record<string, unknown> = {
						phone_number: phoneNumber,
						prompt: prompt,
						force_now: forceNow,
					};

					if (webhookUrl && webhookUrl.trim()) {
						body.webhook_url = webhookUrl.trim();
					}

					if (voiceSelection) {
						const [providerPart, idPart] = voiceSelection.split(':');
						const provider = providerPart || 'cartesia';
						const id = idPart?.trim();

						if (id) {
							body.voice = {
								provider,
								id,
							};
						}
					}

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/api/call`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					});

					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				} else if (operation === 'getCall') {
					const callId = this.getNodeParameter('callId', i) as string;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/call/${callId}`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						json: true,
					});

					returnData.push({
						json: response.call,
						pairedItem: { item: i },
					});
				} else if (operation === 'getCallHistory') {
					const page = this.getNodeParameter('page', i) as number;
					const pageSize = this.getNodeParameter('pageSize', i) as number;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/call`,
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						qs: {
							page,
							pageSize,
						},
						json: true,
					});

					// Return each call as a separate item
					for (const call of response.calls) {
						returnData.push({
							json: call,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
