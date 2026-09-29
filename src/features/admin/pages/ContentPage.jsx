import AnnouncementsManager from '../../../components/admin/AnnouncementsManager'
import TestimonialBuilder from '../../../components/admin/TestimonialBuilder'
import DemoVideoManager from '../../../components/admin/DemoVideoManager'
import GameCatalog from '../../../components/admin/GameCatalog'
import { PageHeader } from '../ui'

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Site content"
        description="What visitors and players see on the public site: announcements, customer proof, the hero video and guide coverage. Changes publish immediately."
      />
      <AnnouncementsManager />
      <TestimonialBuilder />
      <DemoVideoManager />
      <GameCatalog />
    </>
  )
}
