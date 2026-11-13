// Build-time URL only. Never accept a destination from local storage or a query.
export function validateVodStreamUrl(value) {
 if(!value)return ''
 const url=new URL(value)
 if(url.protocol!=='https:'||!/^[a-z0-9]+\.lambda-url\.us-east-1\.on\.aws$/.test(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Invalid VOD streaming Function URL')
 return url.origin
}
export function resolveVodStreamConfig(enabled,value) {
 if(enabled!=='true'&&enabled!=='false'&&enabled!==undefined&&enabled!=='')throw Error('Invalid VOD streaming enable flag')
 if(enabled==='true'&&!value)throw Error('VOD streaming enabled without Function URL')
 const validated=validateVodStreamUrl(value||'')
 return enabled==='true'?validated:''
}
export const VOD_STREAM_URL=resolveVodStreamConfig(import.meta.env?.VITE_VOD_STREAM_ENABLED,import.meta.env?.VITE_VOD_STREAM_URL)
