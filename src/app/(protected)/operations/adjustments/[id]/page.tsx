import { OperationDetailPage } from "@/features/operations/shared/operation-detail-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <OperationDetailPage type="ADJUSTMENT" id={(await params).id} />;
}
