import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Sale {
  id: string;
  product: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  client_name: string;
}

const customers = [
  "Carlos Rodríguez",
  "María González", 
  "Jorge Martínez",
  "Ana Pérez",
  "Luis Torres"
];

export default function CreateSale() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    unitPrice: "",
    customer: "",
    date: undefined as Date | undefined
  });

  useEffect(() => {
    if (user) {
      fetchRecentSales();
    }
  }, [user]);

  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'sale')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      
      setRecentSales(data || []);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.quantity || !formData.unitPrice || !formData.customer || !formData.date) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear ventas",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const quantity = parseFloat(formData.quantity);
      const unitPrice = parseFloat(formData.unitPrice);
      const total = quantity * unitPrice;
      const HIGH_VOLUME_THRESHOLD = 3000000;

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_type: 'sale',
        client_name: formData.customer,
        product: formData.product,
        quantity: quantity,
        unit_price: unitPrice,
        total: total,
        payment_method: 'Por definir',
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Venta creada",
        description: `Venta de ${formData.product} registrada exitosamente`,
      });

      // Check if it's a high-volume sale and show additional notification
      if (total > HIGH_VOLUME_THRESHOLD) {
        setTimeout(() => {
          toast({
            title: "⚠️ Venta de Alto Volumen Detectada",
            description: `Esta venta por valor de ${formatCurrency(total)} será notificada al gerente vía Gmail como venta prioritaria.`,
            duration: 6000,
          });
        }, 500);
      }

      // Reset form
      setFormData({
        product: "",
        quantity: "",
        unitPrice: "",
        customer: "",
        date: undefined
      });

      // Refresh recent sales
      fetchRecentSales();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la venta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-pet-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-pet-text-primary mb-2">
            Crear Venta
          </h1>
          <p className="text-pet-text-secondary text-lg">
            Registra una nueva venta en el sistema
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-card backdrop-blur-sm">
              <CardHeader className="bg-muted rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-card-foreground">
                  Información de la Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Producto */}
                    <div className="space-y-2">
                      <Label htmlFor="product" className="text-foreground font-medium text-base">
                        Producto *
                      </Label>
                      <Input
                        id="product"
                        placeholder="Ej: Alimento Premium para Perro Royal Canin 15kg"
                        value={formData.product}
                        onChange={(e) => handleInputChange("product", e.target.value)}
                        className="h-12 rounded-lg shadow-sm"
                      />
                    </div>

                    {/* Cliente */}
                    <div className="space-y-2">
                      <Label htmlFor="customer" className="text-foreground font-medium text-base">
                        Cliente *
                      </Label>
                      <Select value={formData.customer} onValueChange={(value) => handleInputChange("customer", value)}>
                        <SelectTrigger className="h-12 rounded-lg shadow-sm">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer} value={customer}>
                              {customer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-foreground font-medium text-base">
                        Cantidad *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="5"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange("quantity", e.target.value)}
                        className="h-12 rounded-lg shadow-sm"
                      />
                    </div>

                    {/* Precio Unitario */}
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice" className="text-foreground font-medium text-base">
                        Precio Unitario (COP) *
                      </Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        placeholder="250000"
                        min="0"
                        step="1000"
                        value={formData.unitPrice}
                        onChange={(e) => handleInputChange("unitPrice", e.target.value)}
                        className="h-12 rounded-lg shadow-sm"
                      />
                    </div>

                    {/* Fecha de Venta */}
                    <div className="space-y-2 md:col-span-1">
                      <Label className="text-foreground font-medium text-base">
                        Fecha de Venta *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal rounded-lg shadow-sm",
                              !formData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(formData.date, "PPP") : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.date}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Total Calculado */}
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium text-base">
                        Total Calculado
                      </Label>
                      <div className="h-12 px-4 py-2 bg-muted border border-border rounded-lg flex items-center text-foreground font-semibold text-lg">
                        {formatCurrency(calculateTotal())}
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {loading ? 'Guardando...' : 'Guardar Venta'}
                  </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 h-12 font-medium text-lg rounded-lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales Table */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border-0 bg-card backdrop-blur-sm h-fit">
              <CardHeader className="bg-muted rounded-t-lg">
                <CardTitle className="text-xl font-bold text-card-foreground">
                  Últimas Ventas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="font-semibold text-foreground">Producto</TableHead>
                        <TableHead className="font-semibold text-foreground">Cantidad</TableHead>
                        <TableHead className="font-semibold text-foreground">Total</TableHead>
                        <TableHead className="font-semibold text-foreground">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No hay ventas registradas aún
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-foreground">
                            {sale.product}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sale.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {formatCurrency(sale.total)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(sale.created_at), "dd/MM/yyyy")}
                          </TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}