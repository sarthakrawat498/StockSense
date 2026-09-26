import { OperationDetailPage } from "@/features/operations/shared/operation-detail-page";
export default function Page({ params }: { params: { id: string } }) {
  return <OperationDetailPage type="DELIVERY" id={params.id} />;
}
