import { Link } from 'react-router-dom'

export default function DesktopSetup() {
  return (
    <section id="desktop-setup" style={{ marginTop: '1.5rem', lineHeight: 1.6 }}>
      <h2>Windows desktop setup</h2>
      <p>The downloadable Windows beta and newer test builds are separate. A staged build is not an update to your installed version. Live gameplay recognition, recording, clips, overlays and hotkeys still need release-specific verification; they are not guaranteed here.</p>
      <h3>Playing Siege on PC</h3>
      <ol>
        <li>Install the Windows beta and activate it with your own membership token from <Link to="/activate">Activation</Link>.</li>
        <li>Launch Siege. In a build with capture-source selection, choose the Siege window explicitly and check its preview. Borderless or windowed mode may help if capture is blank.</li>
        <li>Confirm map, side and site yourself. Recognition is experimental. Start capture explicitly; use Stop and mute when you finish.</li>
      </ol>
      <p>If source selection is absent in your installed build, contact <Link to="/support">Support</Link> for its supported setup. Selecting an entire display can expose other windows; choose only the gameplay source you intend to share.</p>
      <h3>Playing on PS5 or another console</h3>
      <ol>
        <li>The app runs on a Windows PC, not on the console. Connect the console HDMI output to the capture card HDMI input, its HDMI passthrough output to your TV/monitor, and the card USB connection to the PC.</li>
        <li>Confirm the gameplay feed in the capture card software first, then select that exact device in a compatible Recon build. A camera preview is not the console feed.</li>
        <li>If PS5 capture is blank, check the card manufacturer's guidance for gameplay capture and HDCP. Protected video apps may not be capturable. Console live-coaching acceptance is still pending.</li>
      </ol>
      <h3>Game audio and coaching voice</h3>
      <p>Picture capture does not prove game audio is being recorded. The staged PC capture path requests video only, with no microphone. Coaching speech plays through Windows output separately; check the selected speakers/headset and mute control. Console/controller headset routing can keep game or party audio out of HDMI. Verify your card and console audio setup separately before relying on a recording.</p>
      <p>Website screenshot reviews are separate from desktop capture. They use the website allowance, and local recording or playback does not establish automatic AI analysis or saved website progress. You can also use the <Link to="/live">manual round planner</Link> without screen capture.</p>
    </section>
  )
}
