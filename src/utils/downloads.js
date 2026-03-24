import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOADS_KEY = '@gc_downloaded_attachments_v1';
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`;

function sanitizeFileName(name) {
	return String(name || 'attachment')
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_+/g, '_')
		.slice(0, 80);
}

function extractExtFromUrl(url) {
	const clean = String(url || '').split('?')[0].split('#')[0];
	const last = clean.split('/').pop() || '';
	const parts = last.split('.');
	const ext = parts.length > 1 ? parts.pop() : '';
	if (!ext) return 'pdf';
	const normalized = ext.toLowerCase();
	if (normalized.length > 6) return 'pdf';
	return normalized;
}

export function parseGoogleDriveFileId(url) {
	const link = String(url || '').trim();
	if (!link) return '';

	const fileMatch = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
	if (fileMatch?.[1]) return fileMatch[1];

	const idParamMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
	if (idParamMatch?.[1]) return idParamMatch[1];

	return '';
}

export function getAttachmentUrls(link) {
	const source = String(link || '').trim();
	const driveId = parseGoogleDriveFileId(source);
	if (!driveId) {
		return {
			isGoogleDrive: false,
			previewUrl: source,
			downloadUrl: source,
		};
	}

	const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
	const embeddedPreviewUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(directDownloadUrl)}`;

	return {
		isGoogleDrive: true,
		previewUrl: embeddedPreviewUrl,
		downloadUrl: directDownloadUrl,
	};
}

export async function listDownloads() {
	const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
	if (!raw) return [];

	let parsed = [];
	try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = [];
	}

	if (!Array.isArray(parsed)) return [];

	const valid = [];
	for (const item of parsed) {
		const uri = String(item?.uri || '');
		if (!uri) continue;
		const info = await FileSystem.getInfoAsync(uri);
		if (info.exists) valid.push(item);
	}

	if (valid.length !== parsed.length) {
		await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(valid));
	}

	return valid;
}

export async function downloadAttachment({ title, link, lessonTitle, courseTitle }) {
	const sourceLink = String(link || '').trim();
	if (!sourceLink) throw new Error('Attachment link missing');

	const existing = await listDownloads();
	const same = existing.find((item) => String(item.sourceLink || '') === sourceLink);
	if (same?.uri) {
		const info = await FileSystem.getInfoAsync(same.uri);
		if (info.exists) return same;
	}

	await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });

	const { downloadUrl } = getAttachmentUrls(sourceLink);
	const ext = extractExtFromUrl(sourceLink);
	const baseName = sanitizeFileName(title || lessonTitle || 'attachment');
	const localUri = `${DOWNLOAD_DIR}${Date.now()}_${baseName}.${ext}`;

	const result = await FileSystem.downloadAsync(downloadUrl, localUri);
	const record = {
		id: `dl_${Date.now()}`,
		title: String(title || 'Attachment'),
		lessonTitle: String(lessonTitle || ''),
		courseTitle: String(courseTitle || ''),
		sourceLink,
		uri: result.uri,
		createdAt: new Date().toISOString(),
	};

	const next = [record, ...existing];
	await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
	return record;
}

export async function clearDownloadById(id) {
	const list = await listDownloads();
	const target = list.find((item) => String(item.id) === String(id));
	if (target?.uri) {
		const info = await FileSystem.getInfoAsync(target.uri);
		if (info.exists) {
			await FileSystem.deleteAsync(target.uri, { idempotent: true });
		}
	}

	const next = list.filter((item) => String(item.id) !== String(id));
	await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
	return next;
}

