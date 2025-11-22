-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

create policy "Only admins can insert roles"
  on public.user_roles
  for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can update roles"
  on public.user_roles
  for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Only admins can delete roles"
  on public.user_roles
  for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Create function to handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  
  -- Assign default 'user' role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Create transaction_status enum
create type public.transaction_status as enum ('pending', 'approved', 'rejected');

-- Create transaction_type enum
create type public.transaction_type as enum ('sale', 'purchase');

-- Create transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_type public.transaction_type not null,
  client_name text not null,
  product text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price > 0),
  total numeric(10, 2) not null check (total > 0),
  payment_method text not null,
  status public.transaction_status default 'pending' not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

-- RLS policies for transactions
create policy "Users can view their own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

create policy "Admins can view all transactions"
  on public.transactions
  for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can create their own transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pending transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id and status = 'pending');

create policy "Admins can update any transaction"
  on public.transactions
  for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete transactions"
  on public.transactions
  for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Trigger for transactions updated_at
create trigger on_transactions_updated
  before update on public.transactions
  for each row execute procedure public.handle_updated_at();