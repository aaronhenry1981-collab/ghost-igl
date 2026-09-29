import GrowthEngine from '../../../components/admin/GrowthEngine'
import CompManager from '../../../components/admin/CompManager'
import { useAdminData } from '../AdminData'
import { PageHeader } from '../ui'

export default function GrowthPage() {
  const { summary } = useAdminData()
  return (
    <>
      <PageHeader
        title="Growth"
        description="Real-gameplay clip publishing from the Owner Coach on this PC, and complimentary access for creators and giveaways."
      />
      <GrowthEngine currentMrr={Number(summary.mrr_dollars || 0)} />
      <CompManager />
    </>
  )
}
