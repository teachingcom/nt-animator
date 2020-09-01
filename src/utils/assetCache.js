import { Store, set, get } from 'idb-keyval';

/** creates an asset cache */
export default class AssetCache {

	/** create a new cache */
	constructor(db, table) {
		this.store = new Store(db, table);
	}

		/** saves an image resource */
	getItem = key => {
		const { store } = this;
		return new Promise(resolve => {
			get(key, store)
				.then((record = { }) => {
					const now = +new Date;
					const { data, expires } = record;
					const success = !!data && !isNaN(expires) && expires > now;
					resolve(success ? data : null);
				})
				// for errors, just resolve with
				// no value
				.catch(() => resolve(null));
		});
	}

	/** saves some data */
	setItem = (key, data, expires = 24 * 60 * 60 * 1000) => {
		const { store } = this;
		return new Promise(resolve => {
			set(key, { data, expires: (+new Date) + expires }, store)
				.then(() => resolve(true))
				.catch(() => resolve(false));
		});
	}

	/** clears all unneeded files from the manifest */
	purge = () => {
		// TODO
	}
	
}

// shared common cache
export const shared = new AssetCache('nt:cached-assets', 'images');