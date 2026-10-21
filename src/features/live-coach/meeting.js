// Imported only when a private session is explicitly joined. No microphone,
// webcam enumeration, automatic capture, media recording or provider keys.
export async function joinGameplayMeeting(credentials, { stream, video, onStatus }) {
  const { DefaultMeetingSession, MeetingSessionConfiguration, DefaultDeviceController, ConsoleLogger, LogLevel } = await import('amazon-chime-sdk-js')
  const logger = new ConsoleLogger('recon-live', LogLevel.OFF)
  const devices = new DefaultDeviceController(logger)
  // Prevent the SDK's label discovery from ever requesting camera/microphone.
  devices.setDeviceLabelTrigger(() => Promise.resolve(new MediaStream()))
  const configuration = new MeetingSessionConfiguration(credentials.Meeting, credentials.Attendee)
  configuration.reconnectTimeoutMs = 15_000
  // The installed SDK checks audioHostURL before opening its audio connection.
  // Avoid even a silent Web Audio input/output path.
  configuration.urls.audioHostURL = null
  const meeting = new DefaultMeetingSession(configuration, logger, devices)
  let ended = false
  const av = meeting.audioVideo
  const observer = {
    audioVideoDidStart: () => onStatus?.('Connected'),
    audioVideoDidStop: () => { if (!ended) onStatus?.('Disconnected. Stop this session before reconnecting.') },
    videoTileDidUpdate: tile => {
      if (!tile.localTile && tile.boundAttendeeId && video) av.bindVideoElement(tile.tileId, video)
    },
    videoTileWasRemoved: () => { if (video) video.srcObject = null },
  }
  async function close() {
    if (ended) return
    ended = true; av.removeObserver(observer)
    av.stopLocalVideoTile(); av.stop()
    await av.stopVideoInput().catch(() => {})
    await av.stopAudioInput().catch(() => {})
    await meeting.destroy().catch(() => {})
    await devices.destroy().catch(() => {})
    if (video) video.srcObject = null
  }
  try {
    av.addObserver(observer)
    av.realtimeMuteLocalAudio()
    if (credentials.role === 'player') {
      if (!stream || stream.getAudioTracks().length || stream.getVideoTracks().length !== 1) throw new Error('Confirm a video-only gameplay source first.')
      av.chooseVideoInputQuality(1280, 720, 15)
      await av.startVideoInput(stream)
    }
    av.start()
    if (credentials.role === 'player') av.startLocalVideoTile()
    return { close }
  } catch (error) { await close(); throw error }
}
