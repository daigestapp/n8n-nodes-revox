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
				const baseUrl = (credentials.baseUrl as string)?.replace(/\/$/, '') || 'https://www.getrevox.com';

				let response: {
					voices?: Array<{
						id: string;
						name: string;
						provider: string;
						language: string;
					}>;
				};
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'GET',
						baseURL: baseUrl,
						url: '/api/voices',
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
		// @ts-expect-error - usableAsTool exists at runtime; n8n-workflow types may lag
		usableAsTool: true,
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}} - {{$parameter["operation"]}}',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Call', value: 'call' },
					{ name: 'Assistant', value: 'assistant' },
				],
				default: 'call',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['call'] },
				},
				options: [
					{ name: 'Get Call', value: 'getCall', description: 'Get details of a specific call', action: 'Get a call' },
					{ name: 'Get Call History', value: 'getCallHistory', description: 'Get list of calls', action: 'Get call history' },
					{ name: 'Place Call', value: 'placeCall', description: 'Place a new AI call', action: 'Place a call' },
				],
				default: 'placeCall',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['assistant'] },
				},
				options: [
					{ name: 'Create', value: 'createAssistant', description: 'Create an assistant', action: 'Create an assistant' },
					{ name: 'Delete', value: 'deleteAssistant', description: 'Delete an assistant', action: 'Delete an assistant' },
					{ name: 'Get', value: 'getAssistant', description: 'Get an assistant by ID', action: 'Get an assistant' },
					{ name: 'List', value: 'listAssistants', description: 'List all assistants', action: 'List assistants' },
					{ name: 'Update', value: 'updateAssistant', description: 'Update an assistant', action: 'Update an assistant' },
				],
				default: 'listAssistants',
			},
			// Place Call parameters
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['call'],
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
						resource: ['call'],
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
						resource: ['call'],
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
						resource: ['call'],
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
						resource: ['call'],
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
						resource: ['call'],
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
						resource: ['call'],
						operation: ['getCallHistory'],
					},
				},
				default: 0,
				description: 'Page number for pagination (0-based, per API)',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['call'],
						operation: ['getCallHistory'],
					},
				},
				default: 10,
				description: 'Number of calls per page (sent as page_size to API)',
			},
			// Assistant ID for Place Call (optional)
			{
				displayName: 'Assistant ID',
				name: 'assistantId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['call'],
						operation: ['placeCall'],
					},
				},
				default: '',
				description:
					'Use a pre-created assistant by ID. If set, prompt/voice/webhook from this form are ignored.',
			},
			// Assistants: Create
			{
				displayName: 'Name',
				name: 'assistantName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['createAssistant'],
					},
				},
				default: '',
				required: true,
				description: 'Name of the assistant',
			},
			{
				displayName: 'Prompt',
				name: 'assistantPrompt',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['createAssistant'],
					},
				},
				default: '',
				required: true,
				description: 'System prompt for the LLM (gpt-4.1)',
			},
			{
				displayName: 'First Sentence',
				name: 'firstSentence',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['createAssistant'],
					},
				},
				default: '',
				description: 'First sentence to use for the call',
			},
			{
				displayName: 'Webhook URL',
				name: 'assistantWebhookUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['createAssistant'],
					},
				},
				default: '',
				description: 'Webhook URL to call when the call is completed',
			},
			{
				displayName: 'Voice Name or ID',
				name: 'assistantVoice',
				type: 'options',
				default: '',
				typeOptions: {
					loadOptionsMethod: 'getVoices',
				},
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['createAssistant'],
					},
				},
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			// Assistants: Get / Update / Delete
			{
				displayName: 'Assistant ID',
				name: 'assistantIdForOp',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['getAssistant', 'updateAssistant', 'deleteAssistant'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the assistant',
			},
			// Update Assistant fields (optional)
			{
				displayName: 'Name',
				name: 'updateAssistantName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['updateAssistant'],
					},
				},
				default: '',
				description: 'Updated name',
			},
			{
				displayName: 'Prompt',
				name: 'updateAssistantPrompt',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['updateAssistant'],
					},
				},
				default: '',
				description: 'Updated system prompt',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);

		const credentials = await this.getCredentials('revoxApi');
		const baseUrl = (credentials.baseUrl as string)?.replace(/\/$/, '') || 'https://www.getrevox.com';

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'placeCall') {
					const phoneNumber = this.getNodeParameter('phoneNumber', i) as string;
					const forceNow = this.getNodeParameter('forceNow', i) as boolean;
					const assistantId = this.getNodeParameter('assistantId', i, '') as string;

					const body: Record<string, unknown> = {
						phone_number: phoneNumber,
						force_now: forceNow,
					};

					if (assistantId && assistantId.trim()) {
						body.assistant_id = assistantId.trim();
					} else {
						const prompt = this.getNodeParameter('prompt', i) as string;
						const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
						const voiceSelection = this.getNodeParameter('voice', i, '') as string;

						const assistant: Record<string, unknown> = {
							prompt,
						};
						if (webhookUrl && webhookUrl.trim()) {
							assistant.webhook_url = webhookUrl.trim();
						}
						if (voiceSelection) {
							const [providerPart, idPart] = voiceSelection.split(':');
							const provider = providerPart || 'cartesia';
							const id = idPart?.trim();
							if (id) assistant.voice = { provider, id };
						}
						body.assistant = assistant;
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'POST',
						baseURL: baseUrl,
						url: '/api/call',
						headers: {
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

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'GET',
						baseURL: baseUrl,
						url: `/api/call/${callId}`,
						json: true,
					});

					returnData.push({
						json: response.call,
						pairedItem: { item: i },
					});
				} else if (operation === 'getCallHistory') {
					const page = this.getNodeParameter('page', i) as number;
					const pageSize = this.getNodeParameter('pageSize', i) as number;

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'GET',
						baseURL: baseUrl,
						url: '/api/call',
						qs: {
							page,
							page_size: pageSize,
						},
						json: true,
					});

					// Return each call as a separate item
					const calls = Array.isArray(response?.calls) ? response.calls : [];
					for (const call of calls) {
						returnData.push({
							json: call,
							pairedItem: { item: i },
						});
					}
				} else if (operation === 'createAssistant') {
					const name = this.getNodeParameter('assistantName', i) as string;
					const prompt = this.getNodeParameter('assistantPrompt', i) as string;
					const firstSentence = this.getNodeParameter('firstSentence', i, '') as string;
					const webhookUrl = this.getNodeParameter('assistantWebhookUrl', i, '') as string;
					const voiceSelection = this.getNodeParameter('assistantVoice', i, '') as string;

					const body: Record<string, unknown> = {
						name,
						prompt,
					};
					if (firstSentence && firstSentence.trim()) body.first_sentence = firstSentence.trim();
					if (webhookUrl && webhookUrl.trim()) body.webhook_url = webhookUrl.trim();
					if (voiceSelection) {
						const [providerPart, idPart] = voiceSelection.split(':');
						const provider = providerPart || 'cartesia';
						const id = idPart?.trim();
						if (id) body.voice = { provider, id };
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'POST',
						baseURL: baseUrl,
						url: '/api/assistants',
						headers: {
							'Content-Type': 'application/json',
						},
						body,
						json: true,
					});

					returnData.push({
						json: response.assistant ?? response,
						pairedItem: { item: i },
					});
				} else if (operation === 'listAssistants') {
					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'GET',
						baseURL: baseUrl,
						url: '/api/assistants',
						json: true,
					});

					const assistants = Array.isArray(response?.assistants) ? response.assistants : [];
					for (const assistant of assistants) {
						returnData.push({
							json: assistant,
							pairedItem: { item: i },
						});
					}
				} else if (operation === 'getAssistant') {
					const assistantId = this.getNodeParameter('assistantIdForOp', i) as string;

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'GET',
						baseURL: baseUrl,
						url: `/api/assistants/${assistantId}`,
						json: true,
					});

					returnData.push({
						json: response.assistant ?? response,
						pairedItem: { item: i },
					});
				} else if (operation === 'updateAssistant') {
					const assistantId = this.getNodeParameter('assistantIdForOp', i) as string;
					const name = this.getNodeParameter('updateAssistantName', i, '') as string;
					const prompt = this.getNodeParameter('updateAssistantPrompt', i, '') as string;

					const body: Record<string, unknown> = {};
					if (name && name.trim()) body.name = name.trim();
					if (prompt !== undefined && prompt !== '') body.prompt = prompt;

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'PATCH',
						baseURL: baseUrl,
						url: `/api/assistants/${assistantId}`,
						headers: {
							'Content-Type': 'application/json',
						},
						body: Object.keys(body).length ? body : {},
						json: true,
					});

					returnData.push({
						json: response.assistant ?? response,
						pairedItem: { item: i },
					});
				} else if (operation === 'deleteAssistant') {
					const assistantId = this.getNodeParameter('assistantIdForOp', i) as string;

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'revoxApi', {
						method: 'DELETE',
						baseURL: baseUrl,
						url: `/api/assistants/${assistantId}`,
						json: true,
					});

					returnData.push({
						json: response ?? { success: true },
						pairedItem: { item: i },
					});
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
