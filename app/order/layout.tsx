import OrderSidebar from "@/components/order/OrderSidebar";
import OrderSummary from "@/components/order/OrderSummary";
import Notification from "@/components/ui/Notification";
import InstructionsMarquee from "@/components/ui/InstructionsMarquee";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ordenes",
    description: "Maneja tus ordenes y pide la comida que más te guste",
    keywords: ["Ordenes", "Comida", "Pedidos"],
}

const OrderLayout = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {

    return (
        <>
            <InstructionsMarquee />
            <div className="flex min-h-screen w-full max-w-full flex-col md:flex-row overflow-x-hidden">

                <OrderSidebar />

                <main className="flex-1 min-h-screen min-w-0 md:h-screen md:overflow-y-auto p-4 sm:p-5 md:p-6" role="main">
                    {children}
                </main>
            </div>
            <OrderSummary />
            <Notification />
        </>
    )


}


export default OrderLayout;
