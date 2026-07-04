import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DOWNLOADS_KEY = '@gc_downloaded_attachments_v2';

const DOWNLOAD_DIR =
	`${FileSystem.documentDirectory}garud_downloads/`;


// ============================================================
// FILE NAME HELPERS
// ============================================================

function sanitizeFileName(name) {
	const value = String(name || 'attachment')
		.trim()
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 80);

	return value || 'attachment';
}


function normalizeExtension(extension) {
	const ext = String(extension || '')
		.trim()
		.toLowerCase()
		.replace('.', '');

	if (!ext) {
		return '';
	}

	if (!/^[a-z0-9]{1,8}$/.test(ext)) {
		return '';
	}

	return ext;
}


function extractExtFromUrl(url) {
	const cleanUrl = String(url || '')
		.split('?')[0]
		.split('#')[0];

	const lastPathPart =
		cleanUrl.split('/').pop() || '';

	const match =
		lastPathPart.match(/\.([a-zA-Z0-9]{1,8})$/);

	return normalizeExtension(match?.[1]);
}


function extractExtFromTitle(title) {
	const value = String(title || '').trim();

	const match =
		value.match(/\.([a-zA-Z0-9]{1,8})$/);

	return normalizeExtension(match?.[1]);
}


function removeExtension(fileName) {
	return String(fileName || '')
		.replace(/\.[a-zA-Z0-9]{1,8}$/, '');
}


// ============================================================
// CONTENT TYPE
// ============================================================

function extensionFromContentType(contentType) {
	const type = String(contentType || '')
		.toLowerCase()
		.split(';')[0]
		.trim();

	const contentTypes = {
		'application/pdf': 'pdf',

		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',

		'text/plain': 'txt',

		'application/msword': 'doc',

		'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
			'docx',

		'application/vnd.ms-powerpoint':
			'ppt',

		'application/vnd.openxmlformats-officedocument.presentationml.presentation':
			'pptx',

		'application/vnd.ms-excel':
			'xls',

		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
			'xlsx',

		'application/zip':
			'zip',

		'application/x-rar-compressed':
			'rar',
	};

	return contentTypes[type] || '';
}


// ============================================================
// FILE TYPE
// ============================================================

export function getFileType(extension) {
	const ext = normalizeExtension(extension);

	if (
		[
			'jpg',
			'jpeg',
			'png',
			'webp',
			'gif',
		].includes(ext)
	) {
		return 'image';
	}

	if (ext === 'pdf') {
		return 'pdf';
	}

	if (
		[
			'doc',
			'docx',
		].includes(ext)
	) {
		return 'document';
	}

	if (
		[
			'ppt',
			'pptx',
		].includes(ext)
	) {
		return 'presentation';
	}

	if (
		[
			'xls',
			'xlsx',
		].includes(ext)
	) {
		return 'spreadsheet';
	}

	if (
		[
			'mp4',
			'mov',
			'mkv',
			'webm',
		].includes(ext)
	) {
		return 'video';
	}

	if (
		[
			'mp3',
			'wav',
			'aac',
			'm4a',
		].includes(ext)
	) {
		return 'audio';
	}

	if (ext === 'txt') {
		return 'text';
	}

	if (
		[
			'zip',
			'rar',
			'7z',
		].includes(ext)
	) {
		return 'archive';
	}

	return 'file';
}


// ============================================================
// GOOGLE DRIVE
// ============================================================

export function parseGoogleDriveFileId(url) {
	const link = String(url || '').trim();

	if (!link) {
		return '';
	}


	const fileMatch =
		link.match(
			/\/file\/d\/([a-zA-Z0-9_-]+)/
		);

	if (fileMatch?.[1]) {
		return fileMatch[1];
	}


	const idParamMatch =
		link.match(
			/[?&]id=([a-zA-Z0-9_-]+)/
		);

	if (idParamMatch?.[1]) {
		return idParamMatch[1];
	}


	const openMatch =
		link.match(
			/\/open\?id=([a-zA-Z0-9_-]+)/
		);

	if (openMatch?.[1]) {
		return openMatch[1];
	}


	return '';
}


// ============================================================
// ATTACHMENT URL
// ============================================================

export function getAttachmentUrls(link) {
	const source =
		String(link || '').trim();


	const driveId =
		parseGoogleDriveFileId(source);


	if (!driveId) {
		return {
			isGoogleDrive: false,

			driveId: '',

			previewUrl: source,

			downloadUrl: source,
		};
	}


	const directDownloadUrl =
		`https://drive.google.com/uc?export=download&id=${driveId}`;


	const embeddedPreviewUrl =
		`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
			directDownloadUrl
		)}`;


	return {
		isGoogleDrive: true,

		driveId,

		previewUrl: embeddedPreviewUrl,

		downloadUrl: directDownloadUrl,
	};
}


// ============================================================
// ENSURE DOWNLOAD DIRECTORY
// ============================================================

async function ensureDownloadDirectory() {
	const directoryInfo =
		await FileSystem.getInfoAsync(DOWNLOAD_DIR);


	if (!directoryInfo.exists) {
		await FileSystem.makeDirectoryAsync(
			DOWNLOAD_DIR,
			{
				intermediates: true,
			}
		);
	}
}


// ============================================================
// READ DOWNLOAD RECORDS
// ============================================================

async function readDownloadRecords() {
	try {
		const raw =
			await AsyncStorage.getItem(
				DOWNLOADS_KEY
			);


		if (!raw) {
			return [];
		}


		const parsed =
			JSON.parse(raw);


		if (!Array.isArray(parsed)) {
			return [];
		}


		return parsed;

	} catch (error) {

		console.error(
			'Failed to read downloads:',
			error
		);


		return [];
	}
}


// ============================================================
// SAVE DOWNLOAD RECORDS
// ============================================================

async function saveDownloadRecords(records) {
	await AsyncStorage.setItem(
		DOWNLOADS_KEY,
		JSON.stringify(records)
	);
}


// ============================================================
// MIGRATE OLD DOWNLOADS
// ============================================================

async function migrateOldDownloads() {
	const OLD_DOWNLOADS_KEY =
		'@gc_downloaded_attachments_v1';


	try {
		const currentRaw =
			await AsyncStorage.getItem(
				DOWNLOADS_KEY
			);


		if (currentRaw) {
			return;
		}


		const oldRaw =
			await AsyncStorage.getItem(
				OLD_DOWNLOADS_KEY
			);


		if (!oldRaw) {
			return;
		}


		const oldDownloads =
			JSON.parse(oldRaw);


		if (!Array.isArray(oldDownloads)) {
			return;
		}


		const migratedDownloads =
			oldDownloads.map((item) => {

				const extension =
					extractExtFromTitle(item?.title) ||
					extractExtFromUrl(item?.sourceLink) ||
					extractExtFromUrl(item?.uri) ||
					'pdf';


				return {
					...item,

					extension,

					fileType:
						getFileType(extension),
				};

			});


		await saveDownloadRecords(
			migratedDownloads
		);


		await AsyncStorage.removeItem(
			OLD_DOWNLOADS_KEY
		);

	} catch (error) {

		console.error(
			'Download migration failed:',
			error
		);

	}
}


// ============================================================
// LIST DOWNLOADS
// ============================================================

export async function listDownloads() {
	await migrateOldDownloads();


	const parsed =
		await readDownloadRecords();


	const validDownloads = [];


	for (const item of parsed) {

		const uri =
			String(item?.uri || '');


		if (!uri) {
			continue;
		}


		try {

			const info =
				await FileSystem.getInfoAsync(uri);


			if (info.exists) {

				validDownloads.push({
					...item,

					size:
						item?.size ??
						info?.size ??
						0,
				});

			}

		} catch (error) {

			console.warn(
				'Failed to verify downloaded file:',
				uri
			);

		}

	}


	if (
		validDownloads.length !==
		parsed.length
	) {

		await saveDownloadRecords(
			validDownloads
		);

	}


	return validDownloads;
}


// ============================================================
// CHECK IF ATTACHMENT IS DOWNLOADED
// ============================================================

export async function isAttachmentDownloaded(link) {
	const sourceLink =
		String(link || '').trim();


	if (!sourceLink) {
		return false;
	}


	const downloads =
		await listDownloads();


	return downloads.some(
		(item) =>
			String(item?.sourceLink || '') ===
			sourceLink
	);
}


// ============================================================
// GET DOWNLOADED ATTACHMENT
// ============================================================

export async function getDownloadedAttachment(link) {
	const sourceLink =
		String(link || '').trim();


	if (!sourceLink) {
		return null;
	}


	const downloads =
		await listDownloads();


	return (
		downloads.find(
			(item) =>
				String(item?.sourceLink || '') ===
				sourceLink
		) || null
	);
}


// ============================================================
// DOWNLOAD ATTACHMENT
// ============================================================

export async function downloadAttachment({
	title,
	link,
	lessonTitle,
	courseTitle,
}) {
	const sourceLink =
		String(link || '').trim();


	if (!sourceLink) {
		throw new Error(
			'Attachment link missing'
		);
	}


	// ----------------------------------------------------------
	// CHECK EXISTING DOWNLOAD
	// ----------------------------------------------------------

	const existingDownloads =
		await listDownloads();


	const existingFile =
		existingDownloads.find(
			(item) =>
				String(item?.sourceLink || '') ===
				sourceLink
		);


	if (existingFile?.uri) {

		const fileInfo =
			await FileSystem.getInfoAsync(
				existingFile.uri
			);


		if (fileInfo.exists) {
			return existingFile;
		}

	}


	// ----------------------------------------------------------
	// CREATE DIRECTORY
	// ----------------------------------------------------------

	await ensureDownloadDirectory();


	// ----------------------------------------------------------
	// GET DOWNLOAD URL
	// ----------------------------------------------------------

	const {
		downloadUrl,
		isGoogleDrive,
		driveId,
	} = getAttachmentUrls(sourceLink);


	// ----------------------------------------------------------
	// DETERMINE EXTENSION
	// ----------------------------------------------------------

	let extension =
		extractExtFromTitle(title) ||
		extractExtFromUrl(sourceLink);


	if (!extension) {
		extension = 'pdf';
	}


	// ----------------------------------------------------------
	// CREATE TEMP FILE
	// ----------------------------------------------------------

	const timestamp =
		Date.now();


	const rawBaseName =
		title ||
		lessonTitle ||
		'attachment';


	const baseName =
		sanitizeFileName(
			removeExtension(rawBaseName)
		);


	const tempUri =
		`${DOWNLOAD_DIR}temp_${timestamp}`;


	// ----------------------------------------------------------
	// DOWNLOAD FILE
	// ----------------------------------------------------------

	let result;


	try {

		result =
			await FileSystem.downloadAsync(
				downloadUrl,
				tempUri
			);

	} catch (error) {

		try {

			const tempInfo =
				await FileSystem.getInfoAsync(
					tempUri
				);


			if (tempInfo.exists) {

				await FileSystem.deleteAsync(
					tempUri,
					{
						idempotent: true,
					}
				);

			}

		} catch { }


		throw new Error(
			'Unable to download attachment'
		);

	}


	// ----------------------------------------------------------
	// VALIDATE DOWNLOAD
	// ----------------------------------------------------------

	const tempInfo =
		await FileSystem.getInfoAsync(
			result.uri
		);


	if (
		!tempInfo.exists ||
		!tempInfo.size
	) {

		await FileSystem.deleteAsync(
			result.uri,
			{
				idempotent: true,
			}
		);


		throw new Error(
			'Downloaded file is empty'
		);

	}


	// ----------------------------------------------------------
	// DETECT CONTENT TYPE
	// ----------------------------------------------------------

	const responseContentType =
		result?.headers?.[
		'Content-Type'
		] ||
		result?.headers?.[
		'content-type'
		];


	const detectedExtension =
		extensionFromContentType(
			responseContentType
		);


	if (detectedExtension) {
		extension = detectedExtension;
	}


	// ----------------------------------------------------------
	// FINAL FILE PATH
	// ----------------------------------------------------------

	const finalUri =
		`${DOWNLOAD_DIR}${timestamp}_${baseName}.${extension}`;


	try {

		await FileSystem.moveAsync({
			from: result.uri,
			to: finalUri,
		});

	} catch (error) {

		await FileSystem.deleteAsync(
			result.uri,
			{
				idempotent: true,
			}
		);


		throw new Error(
			'Unable to save downloaded attachment'
		);

	}


	// ----------------------------------------------------------
	// FILE INFO
	// ----------------------------------------------------------

	const finalInfo =
		await FileSystem.getInfoAsync(
			finalUri
		);


	// ----------------------------------------------------------
	// CREATE RECORD
	// ----------------------------------------------------------

	const record = {

		id:
			`dl_${timestamp}`,

		title:
			String(
				title ||
				'Attachment'
			),

		lessonTitle:
			String(
				lessonTitle ||
				''
			),

		courseTitle:
			String(
				courseTitle ||
				''
			),

		sourceLink,

		uri:
			finalUri,

		extension,

		fileType:
			getFileType(extension),

		size:
			finalInfo?.size || 0,

		isGoogleDrive,

		driveId:
			driveId || '',

		createdAt:
			new Date().toISOString(),

	};


	// ----------------------------------------------------------
	// SAVE RECORD
	// ----------------------------------------------------------

	const nextDownloads = [

		record,

		...existingDownloads.filter(
			(item) =>
				String(item?.sourceLink || '') !==
				sourceLink
		),

	];


	await saveDownloadRecords(
		nextDownloads
	);


	return record;
}


// ============================================================
// DELETE DOWNLOAD
// ============================================================

export async function clearDownloadById(id) {
	const downloads =
		await listDownloads();


	const target =
		downloads.find(
			(item) =>
				String(item?.id) ===
				String(id)
		);


	if (target?.uri) {

		try {

			const info =
				await FileSystem.getInfoAsync(
					target.uri
				);


			if (info.exists) {

				await FileSystem.deleteAsync(
					target.uri,
					{
						idempotent: true,
					}
				);

			}

		} catch (error) {

			console.warn(
				'Unable to delete downloaded file:',
				error
			);

		}

	}


	const nextDownloads =
		downloads.filter(
			(item) =>
				String(item?.id) !==
				String(id)
		);


	await saveDownloadRecords(
		nextDownloads
	);


	return nextDownloads;
}


// ============================================================
// CLEAR ALL DOWNLOADS
// ============================================================

export async function clearAllDownloads() {
	try {

		const directoryInfo =
			await FileSystem.getInfoAsync(
				DOWNLOAD_DIR
			);


		if (directoryInfo.exists) {

			await FileSystem.deleteAsync(
				DOWNLOAD_DIR,
				{
					idempotent: true,
				}
			);

		}


		await AsyncStorage.removeItem(
			DOWNLOADS_KEY
		);


		return [];

	} catch (error) {

		console.error(
			'Unable to clear downloads:',
			error
		);


		throw new Error(
			'Unable to clear downloads'
		);

	}
}


// ============================================================
// DOWNLOAD STORAGE INFO
// ============================================================

export async function getDownloadStorageInfo() {
	const downloads =
		await listDownloads();


	const totalSize =
		downloads.reduce(
			(total, item) =>
				total +
				Number(item?.size || 0),

			0
		);


	return {

		totalDownloads:
			downloads.length,

		totalSize,

	};
}