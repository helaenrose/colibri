import { getBusinessProfile } from "@/src/lib/business-profile"
import TopNavbarClient from "./TopNavbarClient"

const TopNavbar = async () => {
  const profile = await getBusinessProfile()
  return <TopNavbarClient businessName={profile.name} />
}

export default TopNavbar
