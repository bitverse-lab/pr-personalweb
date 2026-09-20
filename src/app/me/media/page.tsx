import MediaLibrary from "@/components/me/media/MediaLibrary";
import StorageSetupNotice from "@/components/me/media/StorageSetupNotice";
import MePageHeader from "@/components/me/MePageHeader";
import { getMediaUsage, getStorageStatus, listMedia } from "@/features/media/actions";

export default async function MediaPage() {
  const { configured } = await getStorageStatus();
  const [items, usage] = configured ? await Promise.all([listMedia(), getMediaUsage()]) : [[], { bytes: 0, count: 0 }];

  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Media" description="Images for your articles and profile, and private documents for job applications." />
      {configured ? <MediaLibrary items={items} usage={usage} /> : <StorageSetupNotice />}
    </div>
  );
}
