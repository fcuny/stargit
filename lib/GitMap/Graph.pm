package StarGit::Graph;

use Dancer ':syntax';
use Moose;

with qw(
  GitHub::Collector::Role::MongoDB
  GitHub::Collector::Role::Graph::Nodes
  GitHub::Collector::Role::Graph::Edges
  GitHub::Collector::Role::Graph::Neighbors
  GitHub::Collector::Role::Graph::Query
  GitHub::Collector::Role::Graph::Search
  GitHub::Collector::Role::Graph::Gexf
);

has name => (
    is => 'ro',
    required => 1,
    isa => 'Str',
);

sub neighbors {
    my ($self, $name) = @_;

    $name ||= $self->name;

    $self->_neighbors($name);

    foreach my $id ( keys %{$self->edges}){
       $self->connections($id);
    }

    $self->remove_leaves();
}

sub _neighbors {
    my ( $self, $name ) = @_;

    my ($country, $language) = $self->_get_info_from_login($name);
    my $degree = $self->nodes->{$name} ? $self->nodes->{$name}->{degree} : 0;
    delete $self->nodes->{$name};

    $self->nodes->{$name} = {
        id       => $name,
        label    => $name,
        degree   => $degree,
        country  => $country,
        language => $language,
    };

    foreach my $type (qw/source target/) {
        $self->_fetch_edges( $name, $type );
    }
}

sub connections {
    my ( $self, $id ) = @_;

    if ( $self->edges->{ $id}->{sourceID}  eq $self->name ) {
        $self->_neighbors( $self->edges->{$id}->{targetID}  );
    }
    else {
        $self->_neighbors( $self->edges->{ $id}->{sourceID}  );
    }
}

sub remove_leaves {
    my $self = shift;

    foreach my $id ( keys %{$self->nodes} ) {
        if ( $self->nodes->{$id}->{degree} < 2 ) {
            delete $self->nodes->{$id};
        }
    }

    foreach my $id ( keys %{$self->edges} ) {
        unless ( $self->nodes->{ $self->edges->{$id}->{sourceID} }
            && $self->nodes->{ $self->edges->{$id}->{targetID} } )
        {
            delete $self->edges->{ $id };
        }
    }
}

sub _fetch_edges {
    my ( $self, $name, $type ) = @_;

    my $connections = $self->db_edges->find( { $type => $name } );

    while ( my $edge = $connections->next ) {
        my $look = $type eq 'source ' ? 'target' : 'source';
        $self->_create_edge($name, $look, $edge);
    }
}

sub _create_edge {
    my ( $self, $name, $type, $edge ) = @_;

    return if $name eq $edge->{$type};

    my $edge_id = $edge->{$type} . $name;
    if ( !defined $self->edges->{$edge_id} ) {
        $self->edges->{$edge_id} = {
            id       => $edge_id,
            targetID => $name,
            sourceID => $edge->{$type},
            weight   => $edge->{weight},
        };

        $self->nodes->{$name}->{degree}++;

        if ( defined $self->nodes->{ $edge->{$type} } ) {
            $self->nodes->{ $edge->{$type} }->{degree}++;
        }
        else {
            my ( $country, $language ) =
              $self->_get_info_from_login( $edge->{$type} );

            $self->nodes->{ $edge->{$type} } = {
                id       => $edge->{$type},
                label    => $edge->{$type},
                degree   => 1,
                country  => $country,
                language => $language,
            };
        }
    }
}

sub _get_info_from_login {
    my ($self, $login) = @_;
    my $info = $self->db_profiles->find_one( { login => $login } );
    my $country  = $info->{country}  || 'null';
    my $language = $info->{language} || 'null';
    return ($country, $language);
}

1;
