import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  MessageCircle, 
  Printer, 
  Download, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  Eye, 
  ChevronRight, 
  Clock, 
  Truck, 
  DollarSign, 
  FileText, 
  Filter, 
  Send, 
  ArrowLeft,
  Crown,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatus, SiteSettings } from '../types/store';
import { updateOrderStatus, deleteOrder, createOrder } from '../services/storeService';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminOrdersProps {
  orders: Order[];
  settings: SiteSettings;
  onRefresh: () => Promise<void>;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, settings, onRefresh }) => {
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'today' | '7days' | '30days'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // In-app Delete Confirmation Modal State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null);

  // In-app Printable Slip Modal
  const [printPreviewOrder, setPrintPreviewOrder] = useState<Order | null>(null);

  // Sync localOrders with prop changes
  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const statusOptions: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Returned',
  ];

  // Format date helper
  const formatOrderDate = (dateVal: any) => {
    if (!dateVal) return 'Recently';
    const date = dateVal?.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered orders list (using localOrders for immediate optimistic UI updates)
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    return localOrders.filter((o) => {
      // Status filter
      if (selectedStatus !== 'All' && o.status !== selectedStatus) return false;

      // Date filter
      if (dateFilter !== 'All') {
        const orderTime = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || 0).getTime();
        const diffMs = now - orderTime;
        if (dateFilter === 'today' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '7days' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '30days' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNum = o.orderNumber?.toLowerCase().includes(q);
        const matchesName = o.customer?.fullName?.toLowerCase().includes(q);
        const matchesPhone = o.customer?.phone?.includes(q);
        const matchesCity = o.customer?.city?.toLowerCase().includes(q);
        return matchesNum || matchesName || matchesPhone || matchesCity;
      }

      return true;
    });
  }, [localOrders, selectedStatus, dateFilter, searchTerm]);

  // Handle status update
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setLoadingAction(true);
      await updateOrderStatus(orderId, newStatus);
      await onRefresh();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showStatus(`Order status updated to "${newStatus}"`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Failed to update status', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle saving admin internal note
  const handleSaveAdminNote = async () => {
    if (!selectedOrder?.id) return;
    try {
      setLoadingAction(true);
      await updateOrderStatus(selectedOrder.id, selectedOrder.status, adminNoteInput);
      await onRefresh();
      setSelectedOrder((prev) => (prev ? { ...prev, adminNotes: adminNoteInput } : null));
      showStatus('Admin note saved', 'success');
    } catch (err: any) {
      showStatus(err.message || 'Failed to save note', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Trigger delete order confirmation dialog (replaces window.confirm)
  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setDeleteOrderError(null);
  };

  // Confirm delete order with immediate optimistic UI update
  const confirmDeleteOrder = async () => {
    if (!orderToDelete || !orderToDelete.id) return;
    try {
      setIsDeletingOrder(true);
      setDeleteOrderError(null);
      const targetId = orderToDelete.id;
      const targetNum = orderToDelete.orderNumber;

      // 1. Delete document from Firestore
      await deleteOrder(targetId);

      // 2. Immediately remove from local list
      setLocalOrders((prev) => prev.filter((o) => o.id !== targetId));

      // 3. Close details if currently open
      if (selectedOrder?.id === targetId) {
        setSelectedOrder(null);
      }
      setOrderToDelete(null);

      // 4. Re-fetch
      if (onRefresh) await onRefresh();
      showStatus(`Order ${targetNum} permanently deleted`, 'success');
    } catch (err: any) {
      console.error('Delete order failed:', err);
      const errMsg = err?.message || String(err);
      setDeleteOrderError(`Delete failed: ${errMsg}`);
      showStatus(`Delete failed: ${errMsg}`, 'error');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Generate sample COD order for testing & verification
  const handleCreateSampleOrder = async () => {
    try {
      setLoadingAction(true);
      const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Faisalabad'];
      const names = ['Syed Hamza Ali', 'Muhammad Daniyal', 'Fatima Zahra', 'Bilal Ahmed Khan', 'Ayesha Malik'];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomPhone = `03${Math.floor(10 + Math.random() * 89)}${Math.floor(1000000 + Math.random() * 8999999)}`;
      
      const sampleItem = {
        productId: 'muaver-souverain-dor',
        productName: "SOUVERAIN D'OR Extrait de Parfum",
        productImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop',
        size: '50ml (Royal Flacon)',
        price: 18500,
        quantity: 1,
      };

      const result = await createOrder({
        customer: {
          fullName: randomName,
          phone: randomPhone,
          city: randomCity,
          address: `House #${Math.floor(10 + Math.random() * 90)}, Street ${Math.floor(1 + Math.random() * 20)}, Phase 6`,
          notes: 'Please verify seal upon delivery.',
        },
        items: [sampleItem],
        subtotal: 18500,
        shippingFee: 0,
        totalAmount: 18500,
        paymentMethod: 'Cash on Delivery (COD)',
      });

      await onRefresh();
      showStatus(`Sample COD order ${result.orderNumber} generated successfully!`, 'success');
    } catch (err: any) {
      showStatus(err.message || 'Failed to create sample order', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Open WhatsApp to message the customer
  const handleMessageCustomerOnWhatsApp = (order: Order) => {
    const rawPhone = order.customer.phone.replace(/\D/g, '');
    let fullPhone = rawPhone;
    if (fullPhone.startsWith('0')) {
      fullPhone = '92' + fullPhone.slice(1);
    } else if (!fullPhone.startsWith('92')) {
      fullPhone = '92' + fullPhone;
    }

    const itemsSummary = (order.items || [])
      .map((item) => `• ${item.productName} (${item.size}) x${item.quantity}`)
      .join('\n');

    const message = [
      `Assalam-o-Alaikum ${order.customer.fullName},`,
      `This is MUAVER Haute Parfumerie regarding your order *${order.orderNumber}*.`,
      ``,
      `Order Details:`,
      itemsSummary,
      `Total: Rs. ${order.totalAmount.toLocaleString()} (Cash on Delivery)`,
      `Shipping Address: ${order.customer.address}, ${order.customer.city}`,
      ``,
      `Current Status: *${order.status}*`,
      ``,
      `If you have any questions or delivery instructions, please let us know!`,
      `MUAVER Royale Concierge`
    ].join('\n');

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Print invoice / shipping slip
  const handlePrintSlip = (order: Order) => {
    // Also open on-screen preview so user can review immediately
    setPrintPreviewOrder(order);

    const logoUrl = settings.landscapeLogoUrl || 'https://i.ibb.co/8n6t1tQH/Untitled-design.png';
    const handlingFee = Number(order.handlingFee || 0);
    const shippingFee = Number(order.shippingFee || 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.orderNumber} - MUAVER Haute Parfumerie</title>
          <style>
            @media print {
              body { padding: 15px; }
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              img { -webkit-print-color-adjust: exact !important; max-width: 150px !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 35px; color: #050F2E; background: #fff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 18px; margin-bottom: 25px; }
            .logo-wrap { margin-bottom: 8px; }
            .header-logo { width: 150px; max-width: 150px; height: auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .brand { font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #050F2E; line-height: 1.2; }
            .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 600; margin-top: 3px; }
            .invoice-title { font-size: 20px; font-weight: bold; color: #0A1A4F; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 25px; }
            .box { background: #fdfaf3; padding: 16px; border-radius: 8px; border: 1px solid #f0d27a; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12px; }
            .box h3 { margin-top: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A67C1A; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #0A1A4F; color: #F8F4E8; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
            .totals { float: right; width: 320px; margin-bottom: 35px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
            .totals-grand { font-size: 15px; font-weight: bold; color: #050F2E; border-top: 2px solid #D4AF37; padding-top: 8px; margin-top: 8px; }
            .footer { clear: both; border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo-wrap">
                <img 
                  src="${logoUrl}" 
                  alt="MUAVER Logo" 
                  class="header-logo"
                  crossorigin="anonymous"
                />
              </div>
              <div class="brand">MUAVER</div>
              <div class="tagline">Crafted for Distinction By AUHS</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">CASH ON DELIVERY SLIP</div>
              <div style="font-size: 13px; color: #0A1A4F; font-weight: bold; margin-top: 6px;">Order #: ${order.orderNumber}</div>
              <div style="font-size: 11px; color: #666;">Date: ${formatOrderDate(order.createdAt)}</div>
              <div style="font-size: 11px; color: #888; margin-top: 4px;">Courier Depot: Karachi Central</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <h3>Recipient & Delivery Address</h3>
              <strong>${order.customer.fullName}</strong><br/>
              Phone: ${order.customer.phone}<br/>
              Address: ${order.customer.address}<br/>
              City: ${order.customer.city}<br/>
              ${order.customer.notes ? `<br/><em>Delivery Note: ${order.customer.notes}</em>` : ''}
            </div>
            <div class="box">
              <h3>Dispatch & Payment Details</h3>
              Payment Method: <strong>${order.paymentMethod || 'Cash on Delivery (COD)'}</strong><br/>
              Order Status: <strong>${order.status}</strong><br/>
              Courier Dispatch Depot: Karachi Central Distribution<br/>
              Tamper Proof Royal Seal: Verified
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item & Flacon Volume</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item) => `
                <tr>
                  <td>
                    <strong>${item.productName}</strong><br/>
                    <span style="color: #666; font-size: 11px;">Volume: ${item.size}</span>
                  </td>
                  <td style="text-align: right;">Rs. ${Number(item.price).toLocaleString()}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">Rs. ${(Number(item.price) * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>Rs. ${Number(order.subtotal).toLocaleString()}</span>
            </div>
            ${handlingFee > 0 ? `
            <div class="totals-row">
              <span>Handling Charges:</span>
              <span>Rs. ${handlingFee.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Delivery Charges:</span>
              <span style="${shippingFee === 0 ? 'color: #16a34a; font-weight: bold;' : ''}">
                ${shippingFee === 0 ? 'FREE (Rs. 0)' : `Rs. ${shippingFee.toLocaleString()}`}
              </span>
            </div>
            <div class="totals-row totals-grand">
              <span>Total Payable on Delivery:</span>
              <span>Rs. ${Number(order.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            Thank you for choosing MUAVER Haute Parfumerie • Crafted for Distinction by AUHS<br/>
            Concierge WhatsApp: ${settings.whatsappNumber || '+92 324 2404984'} • Email: ${settings.contactEmail || 'concierge@muaver.com'}
          </div>

          <script>
            function printSlip() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            }

            var logoImg = document.querySelector('.header-logo');
            if (logoImg && !logoImg.complete) {
              logoImg.onload = printSlip;
              logoImg.onerror = printSlip;
              setTimeout(printSlip, 1500);
            } else {
              window.onload = printSlip;
              setTimeout(printSlip, 500);
            }
          </script>
        </body>
      </html>
    `;

    // Try hidden iframe first for robust printing in sandboxed/iframe contexts
    try {
      let printIframe = document.getElementById('muaver-print-iframe') as HTMLIFrameElement;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'muaver-print-iframe';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        printIframe.style.visibility = 'hidden';
        document.body.appendChild(printIframe);
      }

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        return;
      }
    } catch (e) {
      console.warn('Iframe print access note:', e);
    }

    // Secondary fallback
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    } catch {
      // Preview modal is already open
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showStatus('No orders available to export.', 'error');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'City',
      'Address',
      'Payment Method',
      'Status',
      'Subtotal (PKR)',
      'Total (PKR)',
      'Items Summary',
      'Admin Notes',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsStr = (o.items || [])
        .map((it) => `${it.productName} (${it.size}) x${it.quantity}`)
        .join('; ');

      return [
        `"${o.orderNumber || ''}"`,
        `"${formatOrderDate(o.createdAt)}"`,
        `"${(o.customer?.fullName || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.phone || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.city || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
        `"${o.paymentMethod || 'Cash on Delivery'}"`,
        `"${o.status || 'Pending'}"`,
        o.subtotal || 0,
        o.totalAmount || 0,
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${(o.adminNotes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MUAVER_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-950/70 text-blue-300 border-blue-500/40';
      case 'Shipped':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/40';
      case 'Delivered':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      case 'Cancelled':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      case 'Returned':
        return 'bg-zinc-800 text-zinc-300 border-zinc-600';
      case 'Pending':
      default:
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--gold-500)]/20">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl text-white font-bold tracking-wide flex items-center gap-2.5">
            <span>Orders Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--gold-500)]/20 text-[var(--gold-300)] border border-[var(--gold-500)]/30 font-semibold font-mono">
              {orders.length}
            </span>
          </h2>
          <p className="text-xs text-white/60">
            Track customer orders, manage statuses, WhatsApp concierge messaging, and print packing slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateSampleOrder}
            disabled={loadingAction}
            className="px-3.5 py-2.5 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/15 text-xs font-semibold tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Create a sample COD order for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold-300)]" />
            <span className="hidden sm:inline">Add Sample Order</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-lg border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/10 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#081438] p-4 rounded-xl border border-[var(--gold-500)]/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--gold-300)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer, phone, city..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <span>Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="All">All Time</option>
              <option value="today">Today (24h)</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-[var(--gold-500)]/25 overflow-hidden bg-[#081438] shadow-xl">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-[var(--gold-300)] mx-auto opacity-50" />
            <h4 className="font-heading text-lg font-bold text-white">No Orders Found</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Orders placed by customers through the storefront will display here in real-time.
            </p>
            <button
              onClick={handleCreateSampleOrder}
              disabled={loadingAction}
              className="btn-gold-primary px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 mt-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[var(--navy-900)]" />
              <span>Generate Sample COD Order</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#03091D] text-[var(--gold-300)] uppercase tracking-wider text-[10px] font-heading border-b border-[var(--gold-500)]/20">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone / City</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setAdminNoteInput(ord.adminNotes || '');
                        }}
                        className="font-mono font-bold text-[var(--gold-300)] hover:underline flex items-center gap-1.5"
                      >
                        <span>{ord.orderNumber}</span>
                        <ChevronRight className="w-3 h-3 text-white/30" />
                      </button>
                    </td>

                    <td className="p-4 text-white/60 whitespace-nowrap">
                      {formatOrderDate(ord.createdAt)}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-white block">
                        {ord.customer?.fullName}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {ord.items?.length || 1} item(s)
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-white block font-mono text-[11px]">
                        {ord.customer?.phone}
                      </span>
                      <span className="text-[10px] text-[var(--gold-300)]">
                        {ord.customer?.city}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      Rs. {ord.totalAmount?.toLocaleString()}
                    </td>

                    <td className="p-4 text-white/70">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 whitespace-nowrap">
                        {ord.paymentMethod || 'COD'}
                      </span>
                    </td>

                    <td className="p-4">
                      {/* Direct Inline Status Changer */}
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id!, e.target.value as OrderStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${renderStatusBadge(
                          ord.status
                        )}`}
                      >
                        {statusOptions.map((st) => (
                          <option key={st} value={st} className="bg-[#050F2E] text-white">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Message */}
                        <button
                          onClick={() => handleMessageCustomerOnWhatsApp(ord)}
                          className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-500/30 transition-colors"
                          title="Message customer on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Invoice */}
                        <button
                          onClick={() => handlePrintSlip(ord)}
                          className="p-1.5 rounded-lg bg-[var(--navy-900)] text-[var(--gold-300)] hover:bg-[var(--gold-500)]/20 border border-[var(--gold-500)]/30 transition-colors"
                          title="Print Shipping Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setAdminNoteInput(ord.adminNotes || '');
                          }}
                          className="p-1.5 rounded-lg bg-white/5 text-white/70 hover:text-white border border-white/10 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Order */}
                        <button
                          onClick={() => handleDeleteOrder(ord)}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-500/30 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAIL MODAL / DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#050F2E] border-2 border-[var(--gold-500)]/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--gold-500)]/25">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-lg sm:text-xl font-bold text-white">
                    Order #{selectedOrder.orderNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${renderStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <span className="text-xs text-white/50 block mt-1">
                  Placed on {formatOrderDate(selectedOrder.createdAt)} • Payment: {selectedOrder.paymentMethod || 'Cash on Delivery'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintSlip(selectedOrder)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/10 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="p-4 rounded-xl bg-[#081438] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-heading uppercase tracking-wider text-[var(--gold-300)] block">
                  Change Order Status
                </span>
                <span className="text-xs text-white/60">
                  Changing to Cancelled automatically returns reserved stock to inventory.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id!, e.target.value as OrderStatus)}
                  className="px-4 py-2 rounded-lg bg-[var(--navy-900)] border border-[var(--gold-500)]/40 text-[var(--gold-300)] font-bold text-xs focus:outline-none"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st} className="bg-[#050F2E] text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient */}
              <div className="p-4 rounded-xl bg-[#081438] border border-white/10 space-y-2">
                <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                  Customer Information
                </span>
                <div className="text-xs text-white space-y-1">
                  <p className="font-bold text-sm text-white">{selectedOrder.customer.fullName}</p>
                  <p className="font-mono text-white/80">{selectedOrder.customer.phone}</p>
                  {selectedOrder.customer.email && (
                    <p className="text-white/60">{selectedOrder.customer.email}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleMessageCustomerOnWhatsApp(selectedOrder)}
                    className="btn-gold-outline w-full py-2 rounded text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Message on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 rounded-xl bg-[#081438] border border-white/10 space-y-2">
                <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                  Delivery Address & City
                </span>
                <div className="text-xs text-white space-y-1">
                  <p className="font-semibold text-white">City: <span className="text-[var(--gold-300)]">{selectedOrder.customer.city}</span></p>
                  <p className="text-white/80 leading-relaxed">{selectedOrder.customer.address}</p>
                  {selectedOrder.customer.notes && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase text-white/40 block">Customer Delivery Note:</span>
                      <p className="italic text-white/70 text-[11px] mt-0.5">{selectedOrder.customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Snapshotted Purchased Items */}
            <div className="space-y-3">
              <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                Purchased Flacon Items (Price & Name Snapshotted at Checkout)
              </span>

              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#081438] border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=300'}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover bg-black border border-white/10"
                      />
                      <div>
                        <h5 className="font-heading text-xs font-bold text-white">
                          {item.productName}
                        </h5>
                        <span className="text-[11px] text-white/50 block">
                          Size: <strong className="text-white">{item.size}</strong> • Qty: <strong className="text-white">{item.quantity}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-heading text-xs font-bold text-[var(--gold-300)] block">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-white/40">
                        (Rs. {item.price.toLocaleString()} each)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-xl bg-[#03091D] border border-white/10 space-y-1.5 text-xs text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white">Rs. {Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                {(selectedOrder.handlingFee !== undefined && selectedOrder.handlingFee > 0) && (
                  <div className="flex justify-between">
                    <span>Product Handling Charges:</span>
                    <span className="text-white">Rs. {Number(selectedOrder.handlingFee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span className={selectedOrder.shippingFee === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}>
                    {selectedOrder.shippingFee === 0 ? 'FREE (Rs. 0)' : `Rs. ${Number(selectedOrder.shippingFee).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Amount:</span>
                  <span className="text-[var(--gold-300)] font-heading">
                    Rs. {Number(selectedOrder.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2">
              <span className="text-[10px] font-heading uppercase tracking-widest text-[var(--gold-300)] font-semibold block">
                Internal Admin Notes
              </span>
              <textarea
                rows={2}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="e.g. Courier tracking code: TRAX-894123, confirmed address via phone..."
                className="w-full p-3 rounded-lg bg-[var(--navy-900)] border border-white/10 text-white text-xs focus:border-[var(--gold-300)] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAdminNote}
                  disabled={loadingAction}
                  className="px-4 py-1.5 rounded-lg bg-[var(--gold-500)]/20 border border-[var(--gold-500)]/40 text-[var(--gold-300)] hover:bg-[var(--gold-500)]/30 text-xs font-semibold"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDeleteOrder(selectedOrder)}
                className="px-4 py-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 rounded-lg border border-white/20 text-white/80 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal for Order Deletion */}
      <ConfirmDeleteModal
        isOpen={Boolean(orderToDelete)}
        title="Delete Customer Order"
        itemName={orderToDelete ? `Order #${orderToDelete.orderNumber}` : ''}
        message="Are you sure you want to permanently delete this order record? This action cannot be reversed."
        isDeleting={isDeletingOrder}
        errorMessage={deleteOrderError}
        onConfirm={confirmDeleteOrder}
        onCancel={() => {
          if (!isDeletingOrder) {
            setOrderToDelete(null);
            setDeleteOrderError(null);
          }
        }}
      />

      {/* In-App Printable Slip Preview Modal (Guarantees print works in iframes) */}
      {printPreviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-montserrat">
          <div className="bg-white text-[#050F2E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b-2 border-[#D4AF37] pb-4">
              <div>
                <img
                  src={settings.landscapeLogoUrl || 'https://i.ibb.co/8n6t1tQH/Untitled-design.png'}
                  alt="MUAVER Logo"
                  className="w-[150px] max-w-[150px] h-auto object-contain block mb-2"
                />
                <div className="text-xl font-bold font-heading tracking-wide">MUAVER</div>
                <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  Crafted for Distinction By AUHS
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-[#0A1A4F]">CASH ON DELIVERY SLIP</div>
                <div className="text-xs font-mono font-bold mt-1">Order #: {printPreviewOrder.orderNumber}</div>
                <div className="text-[11px] text-gray-500">{formatOrderDate(printPreviewOrder.createdAt)}</div>
                <div className="text-[10px] text-gray-400">Karachi Central Depot</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <h5 className="font-bold text-[11px] text-[#A67C1A] uppercase tracking-wider mb-1">
                  Recipient & Address
                </h5>
                <p className="font-semibold text-sm">{printPreviewOrder.customer.fullName}</p>
                <p className="font-mono text-gray-700">{printPreviewOrder.customer.phone}</p>
                <p className="text-gray-600 mt-1">{printPreviewOrder.customer.address}, {printPreviewOrder.customer.city}</p>
                {printPreviewOrder.customer.notes && (
                  <p className="italic text-gray-500 text-[11px] mt-1">Note: {printPreviewOrder.customer.notes}</p>
                )}
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <h5 className="font-bold text-[11px] text-[#A67C1A] uppercase tracking-wider mb-1">
                  Dispatch & Verification
                </h5>
                <p>Payment: <strong>{printPreviewOrder.paymentMethod || 'Cash on Delivery (COD)'}</strong></p>
                <p>Status: <strong>{printPreviewOrder.status}</strong></p>
                <p className="text-gray-600 mt-1">Tamper Proof Royal Seal: <strong>Verified</strong></p>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0A1A4F] text-[#F8F4E8] text-[10px] uppercase tracking-wider">
                  <th className="p-2.5">Item & Flacon Volume</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {(printPreviewOrder.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5">
                      <strong>{item.productName}</strong>
                      <span className="block text-[10px] text-gray-500">Volume: {item.size}</span>
                    </td>
                    <td className="p-2.5 text-right font-mono">Rs. {Number(item.price).toLocaleString()}</td>
                    <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">
                      Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5 border-t-2 border-[#D4AF37] pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-mono">Rs. {Number(printPreviewOrder.subtotal).toLocaleString()}</span>
                </div>
                {(printPreviewOrder.handlingFee !== undefined && printPreviewOrder.handlingFee > 0) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product Handling Charges:</span>
                    <span className="font-mono">Rs. {Number(printPreviewOrder.handlingFee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className={printPreviewOrder.shippingFee === 0 ? 'text-emerald-600 font-bold' : 'font-mono'}>
                    {printPreviewOrder.shippingFee === 0 ? 'FREE (Rs. 0)' : `Rs. ${Number(printPreviewOrder.shippingFee).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#050F2E] border-t border-gray-200 pt-1.5">
                  <span>Total Payable:</span>
                  <span className="font-mono font-extrabold text-base">
                    Rs. {Number(printPreviewOrder.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setPrintPreviewOrder(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => handlePrintSlip(printPreviewOrder)}
                className="px-6 py-2 rounded-lg bg-[#0A1A4F] hover:bg-[#050F2E] text-white text-xs font-semibold flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>Print Slip / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
