import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class RevoxApi implements ICredentialType {
	name = 'revoxApi';
	displayName = 'Revox API';
	documentationUrl = 'https://docs.getrevox.com';
	icon: Icon = 'file:../icons/revox.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Revox API key from the dashboard',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://www.getrevox.com/',
			description: 'The base URL for the Revox API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/auth-status', // used for testing api key validity/authentication
			method: 'GET',
		},
	};
}
